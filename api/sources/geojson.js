var SourceModel = require('../../models/source')
  , path = require('path')
  , fs = require('fs-extra')
  , config = require('../../config.json')
  , shp2json = require('shp2json');

exports.process = function(source, callback) {
  callback(null, source);
  var child = require('child_process').fork('api/sources/processor.js');
  child.send({operation:'process', sourceId: source.id});
}

exports.getTile = function(source, z, x, y, params, callback) {
  callback(null);
}

exports.getData = function(source, format, callback) {

  var dir = path.join(config.server.sourceDirectory.path, source.id);
  if (format == 'geojson') {
    var file = source.filePath;
    console.log('pull from path', file);

    if (fs.existsSync(file)) {
      callback(null, {file: file});
      // fs.readFile(file, callback);
    } else {
      callback(null);
    }
  }
}

exports.processSource = function(source, callback) {
  source.status = "Complete";
  source.complete = true;
  source.vector = true;
  source.save(function(err) {
    callback(err);
  });
}
