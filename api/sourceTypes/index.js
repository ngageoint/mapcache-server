exports.process = function(source, callback) {
  var processor = require('./' + source.format);

  processor.process(source, callback);
}

exports.getTile = function(source, z, x, y, callback) {
  var processor = require('./' + source.format);

  processor.getTile(source, z, x, y, callback);
}
