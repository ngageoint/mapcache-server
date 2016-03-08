var path = require('path')
  , find = require('findit')
  , async = require('async')
  , passthrough = require('stream').Transform
  , geojsonStream = require('geojson-stream')
  , decompress = require('decompress-zip')
  , ogr2ogr = require('ogr2ogr')
  , tile = require('mapcache-tile')
  , FeatureModel = require('mapcache-models').Feature
  , log = require('mapcache-log');

var KMZ = function(config) {
  this.config = config || {};
  this.source = this.config.source;
  this.cache = this.config.cache;
  console.log('this.config.source', this.config.source);
  this.generatedFeatures = this.config.source.status.generatedFeatures || 0;
  this.totalFeatures = this.config.source.status.totalFeatures || 0;
  this.featureCount = 0;
  if (this.config.cache) {
    throw new Error('Cannot create KMZ caches at this time');
  }
};

KMZ.prototype.processSource = function(doneCallback, progressCallback) {
  progressCallback = progressCallback || function(source, callback) {callback(null, source);};
  var source = this.source;
  var self = this;
  this.source.vector = true;
  this.source.status = this.source.status || {};

  isAlreadyProcessed(source, function(processed) {
    console.log('the source was processed? ', processed);
    if (processed) {
      return completeProcessing(self.source, function(err, source) {
        console.log('source was already processed, returning', source);

        doneCallback(null, source);
      });
    }
    source.status.message = "Decompressing kmz file";
    progressCallback(source, function(err, updateSource) {
      source = updateSource;
      self.outDirectory = self.config.outputDirectory || path.dirname(source.file.path);
      var fileName = path.basename(path.basename(source.file.path), path.extname(source.file.path)) + '.geojson';

      self.geoJsonFile = path.join(self.outDirectory, fileName);

      if (path.extname(source.file.name) === '.kml') {
        return self._processKml(source.file.path, progressCallback, doneCallback);
      }

      log.info('Decompressing kmz file');
      var zip = new decompress(source.file.path);

      zip.on('extract', function() {
        // find the kml file
        var kmlFile;
        var finder = find(path.join(self.outDirectory, 'extract'));

        finder.on('file', function(file){
          if (/^\.(kml)$/i.test(path.extname(file))) {
            kmlFile = file;
          }
        });

        finder.on('end', function() {
          self._processKml(kmlFile, progressCallback, doneCallback);
        });
      }.bind(this));

      zip.extract({
        path: path.join(self.outDirectory, 'extract')
      });
    }.bind(this));
  });
};

KMZ.prototype._processKml = function(kmlFile, progressCallback, doneCallback) {
  var self = this;
  var gdal = require("gdal");
  var ds = gdal.open(kmlFile);

  var layer = ds.layers;
  console.log('DataSource Layer Count', layer.count());

  var tasks = [];
  for (var i = 0; i < layer.count(); i++) {
    console.log('Layer %d:', i, JSON.stringify(layer.get(i), null, 2));
    tasks.push(self._extractLayer.bind(self, kmlFile, layer.get(i).name, i, progressCallback));
  }

  async.parallel(tasks,
    function(err, results) {
      return completeProcessing(self.source, function(err, source) {
        console.log('source finished processing', source);
        console.log('self.generatedFeatures', self.generatedFeatures);

        doneCallback(null, source);
      });
    }
  );
};

KMZ.prototype._extractLayer = function(file, layer, layerId, progressCallback, callback) {
  var self = this;
  log.info('Extract the layer %s', layer);
  var ogr = ogr2ogr(file);
  var stream = ogr.skipfailures().options([layer]).stream();
  var gjStream = geojsonStream.parse();
  var source = this.source;

  gjStream.on('data', function(feature) {
    self.featureCount++;
    gjStream.pause();
    console.log('creating feature', JSON.stringify(feature, null, 2));
    FeatureModel.createFeature(feature, {sourceId: source.id, layerId: layerId}, function() {
      self.generatedFeatures++;
      source.status.generatedFeatures = self.generatedFeatures;
      source.status.message="Processed " + self.generatedFeatures + " features.";
      progressCallback(source, function(err, updatedSource) {
        source = updatedSource;
        gjStream.resume();
      });
    });
  }.bind(this));
  gjStream.on('close', function() {
    callback(null, layer);
  });
  stream.pipe(gjStream);
};

function isAlreadyProcessed(source, callback) {
  if (source.status && source.status.complete) {
    return callback(true);
  }
  FeatureModel.getFeatureCount({sourceId: source.id, cacheId: null}, function(resultArray){
    log.debug("The source already has features", resultArray);
    if (resultArray[0].count !== '0') {
      return callback(true);
    } else {
      return callback(false);
    }
  });
}

function setSourceCount(source, callback) {
  FeatureModel.getFeatureCount({sourceId: source.id, cacheId: null}, function(resultArray){
    console.log('source count', resultArray);
    source.status.totalFeatures = parseInt(resultArray[0].count);
    callback(null, source);
  });
}

function setSourceExtent(source, callback) {
  FeatureModel.getExtentOfSource({sourceId:source.id}, function(resultArray) {
    source.geometry = {
      type: "Feature",
      geometry: JSON.parse(resultArray[0].extent)
    };
    callback(null, source);
  });
}

function setSourceStyle(source, callback) {
  source.style = source.style || {
    defaultStyle: {
      style: {
        'fill': "#000000",
        'fill-opacity': 0.5,
        'stroke': "#0000FF",
        'stroke-opacity': 1.0,
        'stroke-width': 1
      }
    }
  };
  source.style.styles = source.style.styles || [];
  callback(null, source);
}

function setSourceProperties(source, callback) {
  source.properties = [];
  FeatureModel.getPropertyKeysFromSource({sourceId: source.id}, function(propertyArray){
    async.eachSeries(propertyArray, function(key, propertyDone) {
      FeatureModel.getValuesForKeyFromSource(key.property, {sourceId: source.id}, function(valuesArray) {
        source.properties.push({key: key.property, values: valuesArray.map(function(current) {
          return current.value;
        })});
        propertyDone();
      });
    }, function() {
      callback(null, source);
    });
  });
}

function completeProcessing(source, callback) {
  async.waterfall([
    function(callback) {
      callback(null, source);
    },
    setSourceCount,
    setSourceExtent,
    setSourceStyle,
    setSourceProperties
  ], function (err, source){
    source.status.complete = true;
    source.status.message = "Complete";
    callback(err, source);
  });
}

KMZ.prototype.getTile = function(format, z, x, y, params, callback) {
  tile.getVectorTile(this.source, format, z, x, y, params, callback);
};

KMZ.prototype.generateCache = function(doneCallback) {
  doneCallback(null, null);
};

KMZ.prototype.getDataWithin = function(west, south, east, north, projection, callback) {
  if (this.source) {
    FeatureModel.findFeaturesWithin({sourceId: this.source.id}, west, south, east, north, projection, callback);
  } else {
    FeatureModel.findFeaturesByCacheIdWithin(this.cache.cache.id, west, south, east, north, projection, callback);
  }
};

module.exports = KMZ;
