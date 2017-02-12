FROM mhart/alpine-node:7.4

RUN set -x \
  && addgroup -S paale \
  && adduser -D -S -G paale paale\
  && apk add --no-cache curl tar

COPY . /var/www/paale-dai

RUN chown -R paale:paale /var/www/paale-dai

USER paale

ENV PATH /home/paale/.yarn/bin:$PATH

WORKDIR /var/www/paale-dai

RUN curl -o- -L https://yarnpkg.com/install.sh | sh && yarn

CMD node demo/server.js
