### TODO
- [] Setup Automatic deployment to Heroku from Travis

### Deployment
- heroku login
- heroku plugins:install heroku-container-registry
- docker build -t registry.heroku.com/paale-dai/web -f demo/Dockerfile . (from project root)
- heroku container:login
- docker push registry.heroku.com/paale-dai/web
