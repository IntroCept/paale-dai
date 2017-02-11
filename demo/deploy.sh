#!/bin/sh

wget -qO- https://toolbelt.heroku.com/install.sh | sh
heroku plugins:install heroku-container-registry
docker build -t registry.heroku.com/paale-dai/web -f demo/Dockerfile .
/usr/local/heroku/bin/heroku container:login
docker push registry.heroku.com/paale-dai/web
