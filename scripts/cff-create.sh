#!/bin/sh
JS_NAME=fileb://${CFF_NAME}.js
JSON_NAME=${CFF_NAME}.json
aws cloudfront create-function --name $CFF_NAME \
--function-config Comment="",Runtime=cloudfront-js-1.0 \
--function-code $JS_NAME