var path = require('path')
  , find = require('findit')
  , async = require('async')
  , vector = require('./vector')
  , passthrough = require('stream').Transform
  , gdal = require('gdal')
  , geojsonStream = require('geojson-stream')
  , decompress = require('decompress-zip')
  , ogr2ogr = require('ogr2ogr')
  , tile = require('mapcache-tile')
  , FeatureModel = require('mapcache-models').Feature
  , log = require('mapcache-log');

var KMZ = function(config) {
  this.config = config || {};
  if (this.config.cache) {
    throw new Error('Cannot create KMZ caches at this time');
  }
  this.source = this.config.source;
  this.cache = this.config.cache;
  this.config.source.status = this.config.source.status || {};
  this.generatedFeatures = this.config.source.status.generatedFeatures || 0;
  this.totalFeatures = this.config.source.status.totalFeatures || 0;
  this.featureCount = 0;
};

KMZ.prototype.processSource = function(doneCallback, progressCallback) {
  progressCallback = progressCallback || function(source, callback) {callback(null, source);};
  var source = this.source;
  var self = this;
  this.source.vector = true;
  this.source.status = this.source.status || {};

  vector.isAlreadyProcessed(source, function(processed) {
    console.log('the source was processed? ', processed);
    if (processed) {
      return vector.completeProcessing(self.source, function(err, source) {
        console.log('source was already processed, returning', source);

        doneCallback(null, source);
      });
    }
    progressCallback(source, function(err, updateSource) {
      source = updateSource;
      self.outDirectory = self.config.outputDirectory || path.dirname(source.file.path);
      var fileName = path.basename(path.basename(source.file.path), path.extname(source.file.path)) + '.geojson';

      self.geoJsonFile = path.join(self.outDirectory, fileName);

      if (path.extname(source.file.name) === '.kml') {
        source.status.message="Processing KML file";
        return self._processKml(source.file.path, progressCallback, doneCallback);
      } else {
        source.status.message = "Decompressing KMZ file";
        self._findKmlFile(source.file.path, function(err, kmlFile) {
          return self._processKml(kmlFile, progressCallback, doneCallback);
        });
      }
    }.bind(this));
  });
};

KMZ.prototype._findKmlFile = function(kmz, callback) {
  log.info('Decompressing kmz file');
  var zip = new decompress(kmz);

  zip.on('extract', function() {
    // find the kml file
    var kmlFile;
    var finder = find(path.join(this.outDirectory, 'extract'));

    finder.on('file', function(file){
      if (/^\.(kml)$/i.test(path.extname(file))) {
        kmlFile = file;
      }
    });

    finder.on('end', function() {
      callback(null, kmlFile);
    });
  }.bind(this));

  zip.extract({
    path: path.join(this.outDirectory, 'extract')
  });
};

KMZ.prototype._processKml = function(kmlFile, progressCallback, doneCallback) {
  var self = this;
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
      return vector.completeProcessing(self.source, function(err, source) {
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
    log.info('Layer %s was extracted with %d features', layer, self.generatedFeatures);
    callback(null, layer);
  });
  stream.pipe(gjStream);
};

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
