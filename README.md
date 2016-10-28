paale-dai
===================
[![build status](https://gitlab.com/introcept/paale-dai/badges/master/build.svg)](https://gitlab.com/introcept/paale-dai/commits/master)
[![coverage report](https://gitlab.com/introcept/paale-dai/badges/master/coverage.svg)](https://gitlab.com/introcept/paale-dai/commits/master)

paale-dai is a very simple Node.js based application which acts as a SSO(Single Sign On) microservice for authenticating users for Introcept's internal applications like senani, chakka etc.

Basically, its job is to authenticate user and redirect him back to the internal application that user is trying to access. Suppose, user is trying to access senani. First, senani checks if he is authenticated. If not, senani redirects the user to paale-dai. On successful authentication, paale dai sends the user back to senani.

## How it  works
So, you know that paale-dai autheticates the user and redirects him back. But, the main question is how does paale-dai authenticates the user? paale-dai does not store passwords, but, instead, it authenticates the user based on Google Oauth2 authentication. So, anybody who has email address like `xyz@introcept.co`, can be easily authenticated by paale-dai.

## Application Details
It is a Node.js based application based on [google api client](https://github.com/google/google-api-nodejs-client#oauth2-client) and [node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken). 

Here are the most significant libraries of this project:
* Express
* [google api client](https://github.com/google/google-api-nodejs-client#oauth2-client)
* [node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)

After, the user is authenticated by Google, paale-dai generates a JWT based token(using private key) and redirects the user back to the original requested service(like senani). The original requested service decrypts the JWT(using public key) and knows that the user is authenticated.

Here are a few questions that may arise:
### 1) How do you make sure that the service that requested authentication is actually our internal service?
When a internal service sends a user to paale-dai for authentication, it is actually redirected to `paale-dai.introcept.com?service=senani.introcept.co`. It makes sure that the service is actually valid. Then, paale-dai redirects the user back to `senani.introcept.co`. 
If some dangerous external service(like danger.example.com) redirects the user to `paale-dai.introcept.com/login?redirect=danger.example.com`, paale-dai knows that the some fraudelent external service is requesting jwt and blocks the user authentication and redirection.

## Installation instructions
* First clone the repo
* Generate private/public pair key for jwt encryption
```
openssl genrsa -out data/jwt-private.key 2048
openssl rsa -in data/jwt-private.key -pubout > data/jwt.pub
```
* copy .env.sample to .env and edit the google client credentials.
* Run `docker-compose up -d`
* Distribute data/jwt.pub to the services that requires integration with pale-dai for authentication
