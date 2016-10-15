'use strict';

import app from './app';
import config from './config';

app.listen(config.port, config.host, function () {
  console.log('pale-dai listening on port ' + config.port);
});
