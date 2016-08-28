"use strict";

var Promise     = require('bluebird')
  , mongoose    = require('mongoose')
  , Schema      = mongoose.Schema
  ;

mongoose.Promise = Promise;

var script_schema = new Schema({
    title         : { type : [ String ], index : 'text' }
  , description   : { type : [ String ], index : 'text' }
  , remote        : String
  , filename      : String
}, { collection : 'script' });

// script_schema.pre('save', (next) => {
//   Promise
//     .try(() => {
//       if (!this.createdAt) {
//         this.createdAt = new Date;
//       }
//     })
//     .asCallback(next);
// });

script_schema.statics.search = ($search, cb) => {
  return Promise
          .fromCallback((cb) => {
            Script
              .find(
                  { $text : { $search : $search } }, 
                  { score : { $meta: 'textScore' } }
              )
              .sort({ score : { $meta : 'textScore' } })
              .exec(cb);
          })
          .asCallback(cb);
};

var Script = mongoose.model('Script', script_schema);

module.exports = Script;