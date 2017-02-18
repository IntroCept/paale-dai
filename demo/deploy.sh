#!/bin/sh

# Exit with nonzero exit code if anything fails
set -e

# install heroku cli
wget -qO- https://toolbelt.heroku.com/install.sh | sh

# install herulo container plugin
heroku plugins:install heroku-container-registry

#Build image
docker build -t registry.heroku.com/paale-dai/web -f demo/Dockerfile .

# Login to heroku container registry
/usr/local/heroku/bin/heroku container:login

# push the image to heruko container registry
# heroku with automatically restart the container
docker push registry.heroku.com/paale-dai/web

#some time for the application to start before the health-check
sleep 1

# health check; this will fail if application is not running
curl -sSf http://paale-dai.herokuapp.com/health-check
