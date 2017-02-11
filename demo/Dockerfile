FROM mhart/alpine-node:6.8

COPY . /var/www/paale-dai

WORKDIR /var/www/paale-dai

RUN apk add --no-cache curl tar && curl -o- -L https://yarnpkg.com/install.sh | sh
ENV PATH /root/.yarn/bin:$PATH

RUN chown -R root:root /var/www/paale-dai\
    && yarn

CMD node demo/server.js
