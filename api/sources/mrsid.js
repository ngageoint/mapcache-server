var gdalType = require('./gdalType');

exports.process = function(source, callback) {
  callback(null, source);
  var child = require('child_process').fork('api/sources/processor.js');
  child.send({operation:'process', sourceId: source.id});
}

exports.getData = function(source, callback) {
  callback(null);
}

exports.getTile = gdalType.getTile;
exports.processSource = gdalType.processSource;
