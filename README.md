### Context

CloudFront functions for my own playground.

Please use at your own risk.

Deployment and test can either be via CLI or AWS Console.
Scripts are untested.

### Secure Token

CloudFront function: [media_files_viewer_request.js](./media_files_viewer_request.js)

#### Prepare CloudFront Function

```bash
# set your key
export KEY_ID=your-key-id
export KEY=your-key
sed -i "s/YOUR_KEY_ID/${KEY_ID}/g" ./media_files_viewer_request.js
sed -i "s/YOUR_KEY/${KEY}/g" ./media_files_viewer_request.js

```
review `TODO` comment and make necessary change

#### Deployment

```bash
export CFF_NAME=media_files_viewer_request
./scripts/cff-create.sh
```

#### Test

Generate token using any of the following token generator

* [golang token generator](https://github.com/arief-hidayat/go-token-generator)
* [python token generator](https://github.com/arief-hidayat/py-token-generator)

You can use CLI or AWS console to test

* Go to [AWS Console](https://us-east-1.console.aws.amazon.com/cloudfront/v3/home?#/functions)
* Click the function. e.g. [media_files_viewer_request](https://us-east-1.console.aws.amazon.com/cloudfront/v3/home?#/functions/media_files_viewer_request)
* Click `Test` tab
* Event type `Viewer Request`
* Copy the URL path that was generated previously
* Set headers based on what you use in the token generator, e.g. `host`, `origin`, `referer`, `user-agent`
* Click `Test Function`


### Publish 
Once successful, you can click `Publish` tab and then `Publish Function`.

Alternatively using CLI.
```bash
./scripts/cff-publish.sh
```

### Associate to your CloudFront distribution

* Go to your [CloudFront distributions](https://us-east-1.console.aws.amazon.com/cloudfront/v3/home?#/distributions)
* Click one CloudFront distribution
* Click `Behaviors` tab
* For each behavior that you want to associate this CF Function,
  * Select radio button and click `Edit`
  * Scroll down to `Function associations` section
  * On `Viewer request`,
    * Select `CloudFront Function` from `Function type` dropdown 
    * Select this function name from `Function ARN / Name` dropdown
  * Click `Save changes`

After completely deployed, test your CloudFront distribution.

### Clean up
```bash
./scripts/cff-delete.sh
```
