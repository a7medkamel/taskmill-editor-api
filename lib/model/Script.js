"use strict";

var Promise     = require('bluebird')
  , _           = require('lodash')
  , config      = require('config')
  , mongoose    = require('mongoose')
  , Schema      = mongoose.Schema
  ;

mongoose.Promise = Promise;

var schema = new Schema({
    title         : { type : String, index : 'text' }
  , description   : { type : String, index : 'text' }
  , remote        : String
  , filename      : String
  , repository    : String
  , username      : String
}, { collection : 'script' });

// , html_url    : Script.getUrl('html', doc) 
// , git_url     : Script.getUrl('git', doc) 
schema.virtual('run_url').get(function() {
  let obj = {
      username    : this.username
    , repository  : this.repository
    , filename    : this.filename
    , branch      : 'master'
  };
  
  // todo [akamel] hard coded to github
  return config.get('gateway.url_pattern.github')(obj);
  // return urljoin('https://github.run', this.username, this.repository, 'blob', 'master', this.filename);
  // return urljoin('http://localhost:8070', this.username, this.repository, 'blob', 'master', this.filename);
});

schema.set('toJSON', { virtuals: true });

// schema.pre('save', (next) => {
//   Promise
//     .try(() => {
//       if (!this.createdAt) {
//         this.createdAt = new Date;
//       }
//     })
//     .asCallback(next);
// });

schema.statics.search = ($search, cb) => {
  if ($search) {
    return Promise
            .fromCallback((cb) => {
              Script
                .find(
                    { $text : { $search : $search } }, 
                    { score : { $meta: 'textScore' } }
                )
                .sort({ score : { $meta : 'textScore' } })
                .limit(100)
                .exec(cb);
            })
            .asCallback(cb);
  } else {
    return Promise
            .fromCallback((cb) => {
              Script
                .find({ title : { $exists : true } })
                .limit(100)
                .exec(cb);
            })
            .asCallback(cb);
  }
};

var Script = mongoose.model('Script', schema);

module.exports = Script;