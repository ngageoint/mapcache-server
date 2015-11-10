var SourceModel = require('../models/source')
  , fs = require('fs-extra')
  , path = require('path')
  , async = require('async')
  , Feature = require('../models/feature')
  , sourceProcessor = require('./sources')
  , config = require('mapcache-config');

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
  SourceModel.createSource(source, function(err, newSource) {
    if (err) return callback(err);
    var dir = path.join(config.server.sourceDirectory.path, newSource.id);
    fs.mkdirp(dir, function(err) {
      console.log('error creating directory? ', err);
      if (err) return callback(err);

      async.each(newSource.dataSources, function(dataSource, callback) {
        if (dataSource.file && dataSource.file.name) {
          var originalFile = sourceFiles.filter(function(file) {
            return file.originalname === dataSource.file.name;
          })[0];
          var fileName = path.basename(originalFile.path);
          var file = path.join(dir, dataSource.id);

          fs.rename(originalFile.path, file, function(err) {
            console.log('err', err);
            if (err) return callback(err);
            fs.stat(file, function(err, stat) {
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
        newSource.status = {
          message: "Creating",
          complete: false,
          zoomLevelStatus: {}
        };
        SourceModel.updateSource(newSource.id, newSource, function(err, updatedSource) {
          sourceProcessor.process(updatedSource, callback);
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

Source.prototype.deleteDataSource = function(source, dataSourceId, callback) {
  SourceModel.deleteDataSource(source, dataSourceId, function(err) {
    if (err) return callback(err);
    var dataSource;
    for (var i = 0; i < source.dataSources.length && !dataSource; i++) {
      if (source.dataSources[i]._id.toString() == dataSourceId) {
        dataSource = source.dataSources[i];
      }
    }
    console.log('removing datasource', dataSource);
    if (dataSource && dataSource.file && dataSource.file.path) {
      fs.remove(dataSource.file.path, function(err) {
        SourceModel.getSourceById(source.id, function(err, source) {
          callback(err, source);
        });
      });
    } else {
      callback(err, source);
    }
  });
}

Source.prototype.update = function(id, update, callback) {
  SourceModel.updateSource(id, update, callback);
}

module.exports = Source;
