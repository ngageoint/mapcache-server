var SourceModel = require('../models/source')
  , fs = require('fs-extra')
  , path = require('path')
  , async = require('async')
  , Feature = require('../models/feature')
  , sourceProcessor = require('./sources')
  , config = require('../config.js');

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

Source.prototype.import = function(source, sourceFiles, callback) {
  sourceFiles = Array.isArray(sourceFiles) ? sourceFiles : [sourceFiles];
  console.log('source FIles', sourceFiles);
  console.log('import the source', source);
  SourceModel.createSource(source, function(err, newSource) {
    console.log('created the source', newSource);
    if (err) return callback(err);
    var dir = path.join(config.server.sourceDirectory.path, newSource.id);
    console.log('create directory ', dir);
    fs.mkdirp(dir, function(err) {
      console.log('error creating directory? ', err);
      if (err) return callback(err);

      async.each(newSource.dataSources, function(dataSource, callback) {
        console.log('dataSource', JSON.stringify(dataSource));
        if (dataSource.file && dataSource.file.name) {
          var originalFile = sourceFiles.filter(function(file) {
            console.log('file.original name', file.originalname);
            console.log('file.name ', dataSource.file.name);
            console.log('match?', file.originalname === dataSource.file.name);
            return file.originalname === dataSource.file.name;
          })[0];
          var fileName = path.basename(originalFile.path);
          var file = path.join(dir, dataSource.id);
          console.log('originalfile.path', originalFile.path);
          console.log('file', file);

          fs.rename(originalFile.path, file, function(err) {
            console.log('err', err);
            if (err) return callback(err);
            fs.stat(file, function(err, stat) {
              console.log('file', file);
              dataSource.file.path = file;
              dataSource.size = stat.size;
              newSource.markModified('datasources');
              callback();
            });
          });
        } else {
          callback();
        }
      }, function() {
        console.log('about to save the source', JSON.stringify(newSource));
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
      // var fileName = path.basename(sourceFile.path);
      // var file = path.join(dir, fileName);
      //
      // fs.rename(sourceFile.path, file, function(err) {
      //   if (err) return callback(err);
      //   fs.stat(file, function(err, stat) {
      //     newSource.filePath = file;
      //     newSource.size = stat.size;
      //     newSource.status = {
      //       message: "Creating",
      //       complete: false,
      //       zoomLevelStatus: {}
      //     };
      //     SourceModel.updateSource(newSource.id, newSource, function(err, updatedSource) {
      //       console.log('saved the source', updatedSource);
      //       sourceProcessor.process(updatedSource, callback);
      //     });
      //   });
      // });
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
      if (source.vector) {
        Feature.deleteFeaturesBySourceId(source.id, function(err) {
          callback(err, source);
        });
      } else {
        callback(err, source);
      }
    });
  });
}

Source.prototype.update = function(id, update, callback) {
  SourceModel.updateSource(id, update, callback);
}

module.exports = Source;
