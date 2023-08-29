var crypto = require('crypto');
// replace with corresponding value
var secrets = {
    "YOUR_KEY_ID" : "YOUR_KEY",
}
var response401 = {
    statusCode: 401,
    statusDescription: 'Unauthorized'
};
function _sign(input, key, method) {
    return crypto.createHmac(method, key).update(input).digest('base64url');
}
function _base64urlDecode(str) {
    return String.bytesFrom(str, 'base64url')
}
function _verify(input, key, method, type, signature) {
    if(type === "hmac") {
        var genSign = _sign(input, key, method);
        if(signature === genSign) {
            return true;
        }
        console.log("[" + signature + "] vs [" + genSign + "]")
    }
    return false;
}
function _verify_intsig(payload_jwt, intsig_key, method, type, sessionId, request_headers, request_querystrings) {
    var indirect_attr = '';
    if (payload_jwt['co']){
        if (request_headers['cloudfront-viewer-country']){
            indirect_attr += (request_headers['cloudfront-viewer-country'].value + ':');
        } else if(payload_jwt['co_fallback']) {
            console.log("Viewer country header missing but co_fallback set to true. Skipping internal signature verification");
            return true;
        } else {
            throw new Error('intsig reference error: cloudfront-viewer-country header is missing');
        }
    }
    if (payload_jwt['reg']){
        if (request_headers['cloudfront-viewer-country-region']){
            indirect_attr += (request_headers['cloudfront-viewer-country-region'].value + ':');
        } else if(payload_jwt['reg_fallback']) {
            console.log("Viewer country region header missing but reg_fallback set to true. Skipping internal signature verification");
            return true;
        } else {
            throw new Error('intsig reference error: cloudfront-viewer-country-region header is missing');
        }
    }

    if (payload_jwt['ssn']){
        if (sessionId.length > 0){
            indirect_attr += sessionId + ':';
        } else {
            throw new Error('intsig reference error: Session id is missing');
        }
    }

    if(payload_jwt['headers']) payload_jwt.headers.forEach( attribute => {
        if (request_headers[attribute]){
            indirect_attr += (request_headers[attribute].value + ':' );
        }
    });

    if(payload_jwt['qs']) payload_jwt.qs.forEach( attribute => {
        if (request_querystrings[attribute]){
            indirect_attr += (request_querystrings[attribute].value + ':' );
        }
    });
    indirect_attr = indirect_attr.slice(0,-1);
    if (indirect_attr && !_verify(indirect_attr, intsig_key, method, type, payload_jwt['intsig'])) {
        console.log("Indirect attributes input string:[" + indirect_attr + "]");
        return false;
    } else {
        return true;
    }
}
function validate_token(request, masterManifest, noVerify) {
    var pathArray = request.uri.split('/');
    //initial checks if token is present
    var token = pathArray[1];
    if(!token || pathArray.length < 3){
        throw new Error("Error: No token is present");
    }
    var segments = token.split('.');
    if (segments.length !== 3 && segments.length !== 4) {
        throw new Error('Not enough or too many segments');
    }
    var headerSeg = segments[segments.length - 3];
    var payloadSeg = segments[segments.length - 2];
    var signatureSeg = segments[segments.length - 1];
    var session_id = segments.length === 4 ? segments[0] : '';

    var header = JSON.parse(_base64urlDecode(headerSeg));
    if(!header.kid) {
        throw new Error('Key id not found');
    }
    var key = secrets[header.kid];
    var payload = JSON.parse(_base64urlDecode(payloadSeg));
    if(!payload["faExp"] || !payload['intsig']) {
        throw new Error('faExp and intsig not found');
    }

    if (!noVerify) {
        var signingMethod = 'sha256';
        var signingType = 'hmac';

        // Verify signature. `sign` will return base64 string.
        var signingInput = [headerSeg, payloadSeg].join('.');

        if (!_verify(signingInput, key, signingMethod, signingType, signatureSeg)) {
            throw new Error('Signature verification failed');
        }
        if (payload.nbf && Date.now() < payload.nbf*1000) {
            throw new Error('Token not yet active');
        }

        if (payload.exp && Date.now() > payload.exp*1000) {
            throw new Error('Token expired');
        }

        if (masterManifest && Date.now() > payload["faExp"]*1000) {
            throw new Error('masterManifest token expired');
        }

        if (!_verify_intsig(payload, key, signingMethod, signingType, session_id, request.headers, request.querystring)) {
            throw new Error('Internal signature verification failed');
        }
    }
    pathArray.splice(1,1);
    var newUri = pathArray.join("/");
    return newUri;
}



function handler(event) {
    var request = event.request;
    try{
        // TODO: how do we determine the master manifest?
        var newUri = validate_token(request, request.uri.endsWith("master.m3u8"), false);
        request.uri = newUri;
        return request;
    }
    catch(e) {
        console.log(e);
        return response401;
    }
}