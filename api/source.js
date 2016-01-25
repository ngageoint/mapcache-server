var models = require('mapcache-models')
  , SourceModel = models.Source
  , fs = require('fs-extra')
  , path = require('path')
  , async = require('async')
  , Feature = models.Feature
  , log = require('mapcache-log')
  , Map = require('../map/map')
  , config = require('mapcache-config');

function Source(sourceModel) {
  this.sourceModel = sourceModel;
}

Source.getAll = function(options, callback) {
  SourceModel.getSources(options, callback);
}

Source.getById = function(id, callback) {
  console.log('get source by id', id);
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
    callback(err, newSource);
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
        if (ds) ds = ds[0];
        var fileName = file.originalname;
        var newFilePath = path.join(dir, ds.id);
        fs.rename(file.path, newFilePath, function(err) {
          console.log('err', err);
          if (err) return callback(err);
          fs.stat(newFilePath, function(err, stat) {
            ds.file.path = newFilePath;
            ds.size = stat.size;
            newSource.markModified('datasources');
            callback();
          });
        });
      }, function() {
        newSource.save(function() {
          var map = new Map(newSource);
          map.callbackWhenInitialized(function(err, map) {
            newSource = map.map;
            console.log('map.map', JSON.stringify(map.map, null, 2));
            newSource.status = newSource.status || {};
            newSource.status.complete = true;
            console.log('about to save', newSource);
            newSource.save(function(err) {
              console.log('err from save', err);
              callback(err, map.map);
            });
          });
        });
      });
    });
  });
}

Source.getTile = function(source, format, z, x, y, params, callback) {
  var map = new Map(source);
  map.callbackWhenInitialized(function(err, map) {
    map.getTile(format, z, x, y, params, callback);
  });
}

Source.getOverviewTile = function(source, callback) {
  var map = new Map(source);
  map.callbackWhenInitialized(function(err, map) {
    map.getOverviewTile(callback);
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
  log.info('Deleting the datasource %s from source %s', dataSourceId, this.sourceModel.id);
  SourceModel.deleteDataSource(source, dataSourceId, function(err) {
    if (err) return callback(err);
    var dataSource;
    for (var i = 0; i < source.dataSources.length && !dataSource; i++) {
      if (source.dataSources[i]._id.toString() == dataSourceId) {
        dataSource = source.dataSources[i];
      }
    }
    if (dataSource && dataSource.file && dataSource.file.path) {
      fs.remove(dataSource.file.path, function(err) {
        SourceModel.getSourceById(source.id, function(err, source) {
          callback(err, source);
        });
      });
    } else {
      SourceModel.getSourceById(source.id, function(err, source) {
        callback(err, source);
      });
    }
  });
}

module.exports = Source;
