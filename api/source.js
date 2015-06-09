var SourceModel = require('../models/source')
  , fs = require('fs-extra')
  , path = require('path')
  , sourceProcessor = require('./sources')
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
    newSource.status = {
      message: "Creating",
      complete: false,
      zoomLevelStatus: {}
    };
    newSource.save(function(err){
      sourceProcessor.process(newSource, callback);
    });
  });
}

Source.prototype.import = function(source, sourceFile, callback) {
  console.log('import the source', source);
  SourceModel.createSource(source, function(err, newSource) {
    console.log('created the source', newSource);
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
          newSource.status = {
            message: "Creating",
            complete: false,
            zoomLevelStatus: {}
          };
          SourceModel.updateSource(newSource.id, newSource, function(err, updatedSource) {
            console.log('saved the source', updatedSource);
            sourceProcessor.process(updatedSource, callback);
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

module.exports = Source;
