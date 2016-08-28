var express     = require('express')
  , Promise     = require('bluebird')
  , winston     = require('winston')
  , config      = require('config-url')
  , _           = require('lodash')
  , ascoltatori = require('ascoltatori')
  , mongoose    = require('mongoose')
  , Script      = require('./model/Script')
  ;

mongoose.connect(config.getUrl('mongo'));

var app = express();

app.get('/script', (req, res, next) => {
  var query = req.query['query'];

  Script
    .search(query)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      next(err);
    });
});

function listen(options, cb) {
  var settings = {
    type            : 'redis',
    redis           : require('redis'),
    db              : 5,
    host            : config.getUrlObject('redis').host,
    port            : config.getUrlObject('redis').port,
    password        : config.get('redis.password')
    // return_buffers  : true, // to handle binary payloads
  };

  ascoltatori.build(settings, (err, ascoltatore) => {
    ascoltatore.subscribe('codedb/pull', (key, msg) => {
      console.log(key, msg);
    });
  });

  return Promise
          .promisify(app.listen, { context : app})(options.port)
          .nodeify(cb);
}

module.exports = {
    listen : listen
};