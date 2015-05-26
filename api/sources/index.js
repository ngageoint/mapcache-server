exports.process = function(source, callback) {
  var processor = require('./' + source.format);

  processor.process(source, callback);
}

exports.getTile = function(source, z, x, y, params, callback) {
  var processor = require('./' + source.format);

  processor.getTile(source, z, x, y, params, callback);
}

exports.getData = function(source, format, callback) {
  var processor = require('./' + source.format);
  processor.getData(source, format, callback);
}
