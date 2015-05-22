var util = require('util');

var transformCaches = function(caches, options) {
  return caches.map(function(cache) {
    var c = cache.toJSON({transform: true});
    console.log('transformed cache', c);
    return cache.toJSON({transform: true});
  });
}

exports.transform = function(caches, options) {
  options = options || {};

  if (util.isArray(caches)) {
    return transformCaches(caches, options);
  }
  var c = caches.toJSON({transform: true});
  console.log('transformed cache', c);
  return c;
}
