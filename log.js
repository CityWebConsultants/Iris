var bunyan = require('bunyan');
C.log = bunyan.createLogger({
  name: 'C',
  streams: [{
    path: __dirname + '/logs/main.log',
          }]
});
