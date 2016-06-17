var log = require('mapcache-log')
  , tile = require('mapcache-tile')
  , FeatureModel = require('mapcache-models').Feature
  , config = require('mapcache-config')
  , vector = require('./vector')
  , turf = require('turf')
  , Readable = require('stream').Readable
  , StreamQueue = require('streamqueue')
  , request = require('request')
  , fs = require('fs-extra')
  , path = require('path')
  , async = require('async')
  , Transform = require('stream').Transform
  , shp2json = require('shp2json');

var Shapefile = function(config) {
  log.debug('Constructing a Shapefile format');
  this.config = config || {};
  this.source = this.config.source;
  this.cache = this.config.cache;
  if (this.config.cache && !this.config.outputDirectory) {
    throw new Error('An output directory must be specified in config.outputDirectory');
  }
};

Shapefile.prototype.generateCache = function(doneCallback, progressCallback) {
  doneCallback(null, null);
};

Shapefile.prototype.getData = function(minZoom, maxZoom, callback) {
  callback(null, []);
};

Shapefile.prototype.processSource = function(doneCallback, progressCallback) {
  doneCallback = doneCallback || function() {};
  progressCallback = progressCallback || function(source, callback) {callback(null, source);};
  var source = this.source;
  source.vector = true;
  source.status = source.status || {};
  console.log('source', source);

  vector.isAlreadyProcessed(source, function(processed) {
    log.info('is already processed?', processed);
    if (processed) {
      return vector.completeProcessing(source, function(err, source) {
        log.info('source %s was already processed, returning', source.id);

        doneCallback(null, source);
      });
    }

    source.status.message = "Parsing Shapefile";
    progressCallback(source, function(err, updatedSource) {
      source = updatedSource;
      var stream = fs.createReadStream(source.file.path);
      var file = source.file.path + '.geojson';

      if (fs.existsSync(file)) {
        console.log('file already exists', file);
        return doneCallback(null, source);
      }

      var outStream = fs.createWriteStream(file);
      var gj = "";

      var parser = new Transform();
      parser._transform = function(data, encoding, done) {
        console.log('data transforming');
        gj = gj + data.toString();
        this.push(data);
        done();
      };

      outStream.on('close',function(status) {
        console.timeEnd('shape to json');
        console.time('parsing geojson');
        var gjData = JSON.parse(gj);
        console.timeEnd('parsing geojson');

        // save the geojson to the db
        var count = 0;
        source.status.totalFeatures = gjData.features.length;
        var fivePercent = Math.floor(gjData.features.length * 0.05);
        async.eachSeries(gjData.features, function iterator(feature, callback) {
          async.setImmediate(function() {
            // console.log('create feature', feature);
            FeatureModel.createFeature(feature, {sourceId:source.id}, function() {
              count++;
              source.status.generatedFeatures = count;
              source.status.message="Processing " + ((count/gjData.features.length)*100) + "% complete";
              async.setImmediate(function() {
                if (count % fivePercent === 0) {
                  progressCallback(source, function(err, updatedSource) {
                    source = updatedSource;
                    callback(null, feature);
                  });
                } else {
                  callback(null, feature);
                }
              });
            });
          });
        }, function done() {
          log.info('done processing features');
          source.status.complete = true;
          source.status.failure = false;
          source.status.message="Complete";
          return vector.completeProcessing(source, function(err, source) {
            doneCallback(err, source);
          });
        });
      });

      console.log('parse shapefile to json');
      console.time('shape to json');
      try {
        shp2json(stream).pipe(parser).pipe(outStream);
      } catch (err) {
        doneCallback(err);
      }
    });
  });
};

Shapefile.prototype.getDataWithin = function(west, south, east, north, projection, callback) {
  if (this.source) {
    FeatureModel.findFeaturesWithin({sourceId: this.source.id, cacheId: null}, west, south, east, north, projection, callback);
  }
};

Shapefile.prototype.getTile = function(format, z, x, y, params, callback) {
  log.info('get the tile %d %d %d from Shapefile', z, x, y);
  if (this.source) {
    getTileFromSource(this.source, z, x, y, format, params, callback);
  }
};

function zOrderDatasources(a, b) {
  if (a.source.zOrder < b.source.zOrder) {
    return -1;
  }
  if (a.source.zOrder > b.source.zOrder) {
    return 1;
  }
  // a must be equal to b
  return 0;
}

function getTileFromSource(source, z, x, y, format, params, callback) {
  log.info('get tile %d/%d/%d.%s for source %s', z, x, y, format, source.name);

  tile.getVectorTile(source, format, z, x, y, params, callback);
}

module.exports = Shapefile;
