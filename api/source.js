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

        newSource.filePath = file;
        newSource.complete = false;
        newSource.status = "Creating";
        newSource.save(function(err){
          sourceProcessor.process(newSource, callback);
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

module.exports = Source;
