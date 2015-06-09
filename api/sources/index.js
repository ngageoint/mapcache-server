exports.process = function(source, callback) {
  var processor = require('./' + source.format);

  processor.process(source, callback);
}

exports.getTile = function(source, format, z, x, y, params, callback) {
  var processor = require('./' + source.format);

  processor.getTile(source, format, z, x, y, params, callback);
}

exports.getData = function(source, format, callback) {
  var processor = require('./' + source.format);
  processor.getData(source, format, callback);
}

exports.getFeatures = function(source, west, south, east, north, z, callback) {
  var processor = require('./' + source.format);
  if (processor.getFeatures) {
    processor.getFeatures(source, west, south, east, north, z, callback);
  } else {
    callback(null, null);
  }
}
