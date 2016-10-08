pale-dai
===================
Pale-dai is a very simple Node.js based application which acts as a SSO(Single Sign On) microservice for authenticating users for Introcept's internal applications like senani, deployment-queue etc.

Basically, its job is to authenticate user and redirect him back to an the internal application that user is trying to access. Suppose, user is trying to access senani. First, senani checks if he is authenticated. If not, senani redirects the user to pale-dai. On successful authentication, pale dai sends the user back to senani.

## How it  works
So, you know that pale-dai autheticates the user and redirects him back. But, the main question is how does pale-dai authenticates the user? pale-dai does not store passwords, but, instead, it authenticates the user based on Google Oauth2 authentication. So, anybody who has email address like `xyz@introcept.co`, can be easily authenticated by pale-dai.

