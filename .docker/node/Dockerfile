FROM mhart/alpine-node:6.8

ARG PUID=1000
ARG PGID=1000

RUN set -x \
  && addgroup -g $PGID -S paale \
  && adduser -u $PGID -D -S -G paale paale

RUN npm install -g yarn

USER paale

WORKDIR /var/www/paale-dai

EXPOSE 3000

CMD npm run nodemon
