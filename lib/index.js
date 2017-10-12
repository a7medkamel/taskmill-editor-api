var express     = require('express')
  , Promise     = require('bluebird')
  , winston     = require('winston')
  , config      = require('config-url')
  , _           = require('lodash')
  , ascoltatori = require('ascoltatori')
  , mongoose    = require('mongoose')
  , codedb_sdk  = require('taskmill-core-codedb-sdk')
  , Script      = require('./model/Script')
  ;

mongoose.connect(config.getUrl('editor.mongo'));

var pubsub = Promise.fromCallback((cb) => {
  ascoltatori.build({
    type            : 'redis',
    redis           : require('redis'),
    db              : config.get('pubsub.db'),
    host            : config.getUrlObject('pubsub').host,
    port            : config.getUrlObject('pubsub').port,
    password        : config.get('pubsub.password')
    // return_buffers  : true, // to handle binary payloads
  }, cb);
});

pubsub
  .then((store) => {
    store.subscribe('codedb/pull', (key, msg) => {
      // todo [akamel] this only supports public repos
      if (!msg.private) {
        let ls = codedb_sdk.ls(msg.remote, { branch : 'master'/*, token : token*/, populate : { manual : true, repository : true, username : true } })
          , rm = Script.remove({ remote : msg.remote })
          ;

        Promise
          .all([ ls, rm ])
          .spread((result) => {
            // if repo is too big, only a limited set will have manual populated
            // 1. remove existing script entries
            // 2. insert new entries
            var arr = _.chain(result.data)
                        .filter((item) => !!item.manual)
                        .map((item) => {
                          let ret = {
                              remote      : msg.remote
                            , filename    : item.path
                            , repository  : item.repository
                            , username    : item.username
                          };

                          if (item.manual.title) {
                            ret.title = item.manual.title;
                          }

                          if (item.manual.description) {
                            ret.description = item.manual.description;
                          }

                          return ret;
                        })
                        .value();

            if (_.size(arr)) {
              return Script.insertMany(arr);
            }
          });
      }
    });
  })
  .catch((err) => {
    // eat errors
    winston.error(err);
  });

var app = express();

app.get('/script', (req, res, next) => {
  var query = req.query['query'];

  Script
    .search(query)
    .then((result) => {
      let data = _.map(result, (i) => {
        let ret = i.toJSON();

        delete ret._id;
        return ret;
      });

      res.send(data);
    })
    .catch((err) => {
      next(err);
    });
});

function listen(options, cb) {
  return Promise
          .promisify(app.listen, { context : app})(options.port)
          .nodeify(cb);
}

module.exports = {
    listen : listen
};
