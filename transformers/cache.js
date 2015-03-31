var util = require('util');

var transformCaches = function(caches, options) {
  return caches.map(function(cache) {
    return cache.toJSON({transform: true});
  });
}

exports.transform = function(caches, options) {
  options = options || {};

  return util.isArray(caches) ?
    transformCaches(caches, options) :
    caches.toJSON({transform: true});
}
