var fs = require('fs-extra')
  , path = require('path')
  , find = require('findit')
  , async = require('async')
  , geojsonStream = require('geojson-stream')
  , extend = require('util')._extend
  , decompress = require('decompress-zip')
  , ogr2ogr = require('ogr2ogr')
  , tile = require('mapcache-tile')
  , FeatureModel = require('mapcache-models').Feature
  , log = require('mapcache-log');

var KMZ = function(config) {
  this.config = config || {};
  this.source = this.config.source;
  this.cache = this.config.cache;
  if (this.config.cache) {
    throw new Error('Cannot create KMZ caches at this time');
  }
}

KMZ.prototype.processSource = function(doneCallback, progressCallback) {

  this.source.vector = true;
  this.source.status = this.source.status || {};

  isAlreadyProcessed(this.source, function(processed) {
    console.log('the source was processed? ', processed);
    if (processed) {
      return completeProcessing(this.source, function(err, source) {
        console.log('source was already processed, returning', source);

        doneCallback(null, source);
      });
    }
    this.outDirectory = this.config.outputDirectory || path.dirname(this.source.file.path);
    var fileName = path.basename(path.basename(this.source.file.path), path.extname(this.source.file.path)) + '.geojson';

    this.geoJsonFile = path.join(this.outDirectory, fileName);

    log.info('Decompressing kmz file');
    var zip = new decompress(this.source.file.path);
    var self = this;
    zip.on('extract', function() {

      console.log('extract happened');
      // find the kml file
      var kmlFile;
      var finder = find(path.join(this.outDirectory, 'extract'));

      finder.on('file', function(file, stat){
        console.log('file', file);
        if (/^\.(kml)$/i.test(path.extname(file))) {
          kmlFile = file;
        }
      });

      finder.on('end', function() {
        console.log('kmlfile', kmlFile);
        var gdal = require("gdal");
        var ds = gdal.open(kmlFile);
        var gdalType = require('./gdalType');

        var layer = ds.layers;
        console.log('DataSource Layer Count', layer.count());

        var tasks = [];
        for (var i = 0; i < layer.count(); i++) {
          console.log('Layer %d:', i, layer.get(i));
          tasks.push(self._extractLayer.bind(self, kmlFile, layer.get(i).name, i));
        }

        async.parallel(tasks,
          function(err, results) {
            log.info('Merge the GeoJSON files', results);
            return completeProcessing(self.source, function(err, source) {
              console.log('source was already processed, returning', source);

              doneCallback(null, source);
            });
          }
        );
      });
    }.bind(this));

    zip.extract({
      path: path.join(this.outDirectory, 'extract')
    });
  }.bind(this));

}

KMZ.prototype._extractLayer = function(file, layer, layerId, callback) {
  console.log('this', this);
  log.info('Extract the layer %s', layer);

  var ogr = ogr2ogr(file);
  var stream = ogr.skipfailures().options([layer]).stream();
  var gjStream = geojsonStream.parse();
  gjStream.on('data', function(feature) {
    // console.log('feature', feature);
    var source = this.source.id;
    FeatureModel.createFeature(feature, {sourceId: this.source.id, layerId: layerId}, function(err) {
      log.debug('Created feature for sourceId %s and layerId %s', source, layerId, feature);
    });
  }.bind(this));
  gjStream.on('end', function() {
    callback(null, layer);
  })
  stream.pipe(gjStream);
}

function isAlreadyProcessed(source, callback) {
  log.debug('is it already processed?', source);
  if (source.status && source.status.complete) {
    return callback(true);
  }
  FeatureModel.getFeatureCount({sourceId: source.id}, function(resultArray){
    log.debug("The source already has features", resultArray);
    if (resultArray[0].count != '0') {
      return callback(true);
    } else {
      return callback(false);
    }
  });
}

function setSourceCount(source, callback) {
  FeatureModel.getFeatureCount({sourceId: source.id}, function(resultArray){
    source.status.totalFeatures = resultArray[0].count;
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
}

KMZ.prototype.generateCache = function(doneCallback, progressCallback) {
  doneCallback(null, null);
}

KMZ.prototype.getDataWithin = function(west, south, east, north, projection, callback) {
  FeatureModel.findFeaturesWithin({sourceId: this.source.id}, west, south, east, north, projection, callback);
}

module.exports = KMZ;
