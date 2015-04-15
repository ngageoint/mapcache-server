exports.process = function(source, callback) {
  var processor = require('./' + source.format);

  processor.process(source, callback);
}

exports.getTile = function(source, z, x, y, callback) {
  var processor = require('./' + source.format);

  processor.getTile(source, z, x, y, callback);
}

exports.createCache = function(cache) {
  var processor = require('./' + cache.source.format);
  processor.createCache(cache);
}
