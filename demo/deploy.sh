#!/bin/sh

wget -qO- https://toolbelt.heroku.com/install.sh | sh
ln -s /usr/local/lib/heroku/bin/heroku /usr/local/bin/heroku
heroku login
heroku plugins:install heroku-container-registry
docker build -t registry.heroku.com/paale-dai/web -f demo/Dockerfile
heroku container:login
docker push registry.heroku.com/paale-dai/web