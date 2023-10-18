var crypto = require('crypto');
// replace with corresponding value
var secrets = {
    "YOUR_KEY_ID" : "YOUR_KEY",
}
var response401 = {
    statusCode: 401,
    statusDescription: 'Unauthorized'
};
function _base64urlDecode(str) {
    return String.bytesFrom(str, 'base64url')
}
function validate_token(request) {
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

    var header = JSON.parse(_base64urlDecode(headerSeg));
    if(!header.kid) {
        throw new Error('Key id not found');
    }
    var payload = JSON.parse(_base64urlDecode(payloadSeg));
    if(!payload['intsig']) {
        throw new Error('intsig not found');
    }
    pathArray.splice(1,1);
    return pathArray.join("/");
}



function handler(event) {
    var request = event.request;
    try{
        request.uri = validate_token(request);
        return request;
    }
    catch(e) {
        console.log(e);
        return response401;
    }
}