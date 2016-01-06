var models = require('mapcache-models')
  , SourceModel = models.Source
  , fs = require('fs-extra')
  , path = require('path')
  , async = require('async')
  , Feature = models.Feature
  , sourceProcessor = require('./sources')
  , Map = require('../map/map')
  , config = require('mapcache-config');

function Source(sourceModel) {
  this.sourceModel = sourceModel;
}

Source.getAll = function(options, callback) {
  SourceModel.getSources(options, callback);
}

Source.getById = function(id, callback) {
  SourceModel.getSourceById(id, function(err, source) {
    callback(err, source);
  });
}

Source.update = function(id, update, callback) {
  SourceModel.updateSource(id, update, callback);
}

Source.create = function(source, sourceFiles, callback) {
  if (!callback && typeof sourceFiles === 'function') {
		callback = sourceFiles;
		sourceFiles = [];
	}

  sourceFiles = Array.isArray(sourceFiles) ? sourceFiles : [sourceFiles];

  SourceModel.createSource(source, function(err, newSource) {
    console.log('new source', JSON.stringify(newSource, null, 2));
    var dir = path.join(config.server.sourceDirectory.path, newSource.id);
    fs.mkdirp(dir, function(err) {
      console.log('error creating directory? ', err);
      if (err) return callback(err);

      // move all of the files into the source directory then process the map
      async.each(sourceFiles, function(file, callback) {
        // find the data source for this file
        var ds = newSource.dataSources.filter(function(dataSource) {
          return dataSource.file && dataSource.file.name == file.originalname;
        });
        var fileName = file.originalname;
        var file = path.join(dir, dataSource.id);
        fs.rename(file.path, file, function(err) {
          console.log('err', err);
          if (err) return callback(err);
          fs.stat(file, function(err, stat) {
            dataSource.file.path = file;
            dataSource.size = stat.size;
            newSource.markModified('datasources');
            callback();
          });
        });
      }, function() {
        newSource.save(function() {
          var map = new Map(newSource);
          map.callbackWhenInitialized(function(err, map) {
            console.log('map.map', JSON.stringify(map.map, null, 2));
            callback(err, map.map);
          });
        });
      });
    });
  });

  // SourceModel.createSource(source, function(err, newSource) {
  //   if (err) return callback(err);
  //   newSource.complete = false;
  //   newSource.status = {
  //     message: "Creating",
  //     complete: false,
  //     zoomLevelStatus: {}
  //   };

    // var dir = path.join(config.server.sourceDirectory.path, newSource.id);
    // fs.mkdirp(dir, function(err) {
    //   console.log('error creating directory? ', err);
    //   if (err) return callback(err);
    //
    //   async.each(newSource.dataSources, function(dataSource, callback) {
    //     if (dataSource.file && dataSource.file.name) {
    //       var originalFile = sourceFiles.filter(function(file) {
    //         return file.originalname === dataSource.file.name;
    //       })[0];
    //       var fileName = path.basename(originalFile.path);
    //       var file = path.join(dir, dataSource.id);
    //
    //       fs.rename(originalFile.path, file, function(err) {
    //         console.log('err', err);
    //         if (err) return callback(err);
    //         fs.stat(file, function(err, stat) {
    //           dataSource.file.path = file;
    //           dataSource.size = stat.size;
    //           newSource.markModified('datasources');
    //           callback();
    //         });
    //       });
    //     } else {
    //       callback();
    //     }
    //   }, function() {
    //     newSource.status = {
    //       message: "Creating",
    //       complete: false,
    //       zoomLevelStatus: {}
    //     };
    //     newSource.save(function(err){
    //       sourceProcessor.process(newSource, callback);
    //     });
    //   });
    // });
  // });
}

Source.prototype.import = function(sourceFiles, callback) {
  var source = this.sourceModel;
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

Source.prototype.delete = function(callback) {
  var source = this.sourceModel;
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

Source.prototype.deleteDataSource = function(dataSourceId, callback) {
  var source = this.sourceModel;
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



module.exports = Source;
