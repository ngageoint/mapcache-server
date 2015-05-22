var SourceModel = require('../models/source')
  , fs = require('fs-extra')
  , path = require('path')
  , sourceProcessor = require('./sourceTypes')
  , config = require('../config.json');

function Source() {
}

Source.prototype.getAll = function(options, callback) {
  SourceModel.getSources(options, callback);
}

Source.prototype.create = function(source, callback) {
  SourceModel.createSource(source, function(err, newSource) {
    if (err) return callback(err);
    newSource.complete = false;
    newSource.status = "Creating";
    newSource.save(function(err){
      sourceProcessor.process(newSource, callback);
    });
  });
}

Source.prototype.import = function(source, sourceFile, callback) {
  SourceModel.createSource(source, function(err, newSource) {
    if (err) return callback(err);
    var dir = path.join(config.server.sourceDirectory.path, newSource.id);
    fs.mkdirp(dir, function(err) {
      if (err) return callback(err);

      var fileName = path.basename(sourceFile.path);
      var file = path.join(dir, fileName);

      fs.rename(sourceFile.path, file, function(err) {
        if (err) return callback(err);
        fs.stat(file, function(err, stat) {
          newSource.filePath = file;
          newSource.size = stat.size;
          newSource.complete = false;
          newSource.status = "Creating";
          newSource.save(function(err) {
            sourceProcessor.process(newSource, callback);
          });
        });
      });
    });
  });
}

Source.prototype.getById = function(id, callback) {
  SourceModel.getSourceById(id, function(err, source) {
    callback(err, source);
  });
}

Source.prototype.delete = function(source, callback) {
  SourceModel.deleteSource(source, function(err) {
    if (err) return callback(err);
    fs.remove(config.server.sourceDirectory.path + "/" + source.id, function(err) {
      callback(err, source);
    });
  });
}

Source.prototype.update = function(id, update, callback) {
  SourceModel.updateSource(id, update, callback);
}

Source.prototype.getDataAsString = function(source, callback) {
  var dir = path.join(config.server.sourceDirectory.path, source.id);
  var fileName = path.basename(path.basename(source.filePath), path.extname(source.filePath)) + '.geojson';
  var file = path.join(dir, fileName);
  console.log('pull from path', file);

  if (fs.existsSync(file)) {
    fs.readFile(file, callback);
  } else {
    callback(null);
  }
}

module.exports = Source;
