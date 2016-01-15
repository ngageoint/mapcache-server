var assert = require('assert')
  , async = require('async')
  , turf = require('turf')
  , fs = require('fs-extra')
  , log = require('mapcache-log')
  , FeatureModel = require('mapcache-models').Feature
  , devnull = require('dev-null')
  , path = require('path')
  , Cache = require('../../cache/cache')
  , should = require('should');

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function toHex(d) {
    return  ("0"+(Number(d).toString(16))).slice(-2).toUpperCase()
}

function getRandomColor() {
  return '#' + toHex(getRandomInt(0, 256)) + toHex(getRandomInt(0, 256)) + toHex(getRandomInt(0, 256));
}

function getRandomStyle() {
  return {
    'fill': getRandomColor(),
    'fill-opacity': 0.5,
    'stroke': getRandomColor(),
    'stroke-opacity': 0.5,
    'stroke-width': 1
  }
}

var formatDataSources = [{
  id: 'test-xyz',
  name: 'osm',
  url: 'http://osm.geointapps.org/osm',
  format: 'xyz',
  zOrder: 0
}/*,{
  id: 'test-mapbox-xyz',
  name: 'mapbox',
  url: 'http://mapbox.geointapps.org:2999/v4/mapbox.light',
  format: 'xyz',
  zOrder: 1
},{
  id: 'test-point',
  name: 'point-geojson',
  file: {
    path: __dirname + '/point.json',
    name: 'point.json'
  },
  format: 'geojson',
  zOrder: 1,
  testParams: {
    featureCount: 1
  }
},{
  id: 'test-wms',
  name: 'wms',
  format: 'wms',
  url: 'http://watzmann.geog.uni-heidelberg.de/cached/osm',
  zOrder: 0,
  wmsLayer: {
    Name: 'osm_auto:all'
  }
},{
  id: 'test-arcgis',
  name: 'arcgis',
  format: 'arcgis',
  url: 'http://tiles.arcgis.com/tiles/cc7nIINtrZ67dyVJ/arcgis/rest/services/Gorkha_West_2015/MapServer',
  zOrder: 0
},{
  id: 'test-geotiff',
  name: 'geotiff',
  format: 'geotiff',
  file: {
    path: __dirname + '/denver.tif',
    name: 'geotiff'
  },
  zOrder: 0
},{
  id: 'test-geopackage',
  name: 'rivers-gp',
  vector: true,
  file: {
    path:__dirname + '/rivers-test.gpkg',
    name: 'rivers_test.gpkg'
  },
  format: 'geopackage',
  zOrder: 2,
  style: {
    defaultStyle: {
      style: getRandomStyle()
    }
  },
  testParams: {
    featureCount: 357
  }
},{
  id: 'test-mrsid',
  name: 'mrsid',
  format: 'mrsid',
  file: {
    path: __dirname + '/toronto.sid',
    name: 'toronto.sid'
  },
  zOrder: 0
},{
  id: 'test-kmz',
  name: 'nepal',
  file: {
    path:__dirname + '/nepal.kmz',
    name: 'nepal.kmz'
  },
  format: 'kmz',
  zOrder: 0,
  testParams: {
    featureCount: 3807
  }
}*/];
//var xyz = xyzTileUtils.getXYZFullyEncompassingExtent(turf.extent(arcgis.source.geometry));
describe('Format Tests', function() {

  formatDataSources.forEach(function(dataSource) {
    dataSource.testParams = dataSource.testParams || {
      featureCount: 0
    };
    var formatName = dataSource.format;
    console.log('testing ' + formatName);
    var Format = require('../../format/'+formatName);

    describe(dataSource.format + ' #constructor', function () {
      it('should construct a '+formatName+' with a source', function () {
        var f = new Format({source: {id: '5'}, outputDirectory:'/tmp'});
        f.source.id.should.equal('5');
      });
      it('should construct a '+formatName+' with a cache', function() {
        try {
          var f = new Format({cache: {id: '6'}, outputDirectory:'/tmp'});
          f.cache.id.should.equal('6');
        } catch (e) {
        }
      });
    });

    describe(dataSource.format + ' source tests', function() {
      var f;
      before(function(done) {
        f = new Format({
          source: dataSource,
          outputDirectory:'/tmp'
        });
        FeatureModel.deleteFeaturesBySourceId(dataSource.id, function(count) {
          log.info('deleted %d %s features', count, dataSource.id);
          done();
        });
      });
      after(function(done){
        FeatureModel.deleteFeaturesBySourceId(dataSource.id, function(count) {
          log.info('deleted %d %s features', count, dataSource.id);
          done();
        });
      });
      it('should process the source ' + dataSource.id, function(done) {
        this.timeout(30000);
        f.processSource(function(err, newSource) {
          if(err) {
            return done(err);
          }
          newSource.status.message.should.equal("Complete");
          console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~DONE PROCESSING THE SOURCE');
          done();
        }, function(source, callback) {
          console.log('source processing progress', source);
          callback(null, source);
        });
      });
      it('should pull the 0/0/0 tile for the data source ' + dataSource.id, function(done) {
        f.getTile('png', 0, 0, 0, dataSource.params || {}, function(err, tileStream) {
          if (err) {
            console.log('there was an err', err);
            done(err);
            return;
          }

          should.exist(tileStream);

          console.log('writing the file');
          var ws = fs.createOutputStream(path.join('/tmp', 'test_'+dataSource.id+'.png'));
          ws.on('close', function() {
            done();
          });

          tileStream.pipe(ws);
        });
      });

      it('should get all features of the source', function(done) {
        f.getDataWithin(-179, -85, 179, 85, 4326, function(err, features) {
          console.log('err', err);
          if (err) {
            done(err);
            return;
          }

          log.info("Get All Features feature count", features);
          if (dataSource.testParams && dataSource.testParams.featureCount) {
            features.length.should.be.equal(dataSource.testParams.featureCount);
          } else {
            features.length.should.be.equal(0);
          }
          done();
        });
      });
    });


    describe(dataSource.format + ' cache tests', function() {

      var map = {
        id: 'test-map',
        dataSources: [dataSource]
      };

      var cache = {
        id: 'test-cache',
        name: dataSource.id + ' test cache',
        geometry: turf.polygon([[
          [-179, -85],
          [-179, 85],
          [179, 85],
          [179, -85],
          [-179, -85]
        ]]),
        minZoom: 0,
        maxZoom: 2,
        source: map,
        outputDirectory: '/tmp'
      };

      var f;
      before(function(done) {
        this.timeout(30000);
        console.log('doing the before');
        FeatureModel.deleteFeaturesBySourceId(dataSource.id, function(count) {
          log.info('deleted %d %s features', count, dataSource.id);
          var cacheObj = new Cache(cache);
          cacheObj.callbackWhenInitialized(function(err, cacheObj) {
            console.log('format', Format);
            try {
              f = new Format({
                cache: cacheObj,
                outputDirectory:cache.outputDirectory
              });
            } catch (e) {
            }
            done();
          });
        });
      });
      after(function(done) {
        fs.remove(path.join(cache.outputDirectory, cache.id), function(err) {
          fs.remove(path.join(cache.outputDirectory, map.id), function(err) {
            FeatureModel.deleteFeaturesBySourceId(dataSource.id, function(count) {
              log.info('deleted %d %s features', count, dataSource.id);
              done();
            });
          });
        });
      });

      it ('should run tests if available for source ' + dataSource.format, function() {
        if (!f) return;
        describe(dataSource.format + ' cache tests if available', function() {
          console.log('in the cache tests for source ' + dataSource.format);

          it('should pull the 0/0/0 tile for the cache', function(done) {
            this.timeout(30000);
            f.getTile('png', 0, 0, 0, dataSource.params || {noCache: true}, function(err, stream) {
              if (err) {
                done(err);
                return;
              }

              should.exist(stream);

              var ws = fs.createOutputStream(path.join('/tmp', 'test_000_'+dataSource.id+'.png'));
              ws.on('close', function() {
                done();
              });
              stream.pipe(ws);

            });
          });

          it('should pull the 0/0/0 geojson tile for the cache if there is one', function(done) {
            this.timeout(30000);
            f.getTile('geojson', 0, 0, 0, {noCache: true, projection: 4326}, function(err, stream) {
              if (err) {
                done(err);
                return;
              }
              if (dataSource.testParams && dataSource.testParams.featureCount) {
                should.exist(stream);
                var ws = fs.createOutputStream(path.join('/tmp', 'test_000_'+dataSource.id+'.geojson'));
                ws.on('close', function() {
                  done();
                });
                stream.pipe(ws);
              } else {
                should.not.exist(stream);
                done();
              }
            });
          });

          describe('cache generation tests', function() {
            beforeEach(function(done) {
              FeatureModel.deleteFeaturesByCacheId(cache.id, function(count) {
                log.info('deleted %d %s features', count, cache.id);
                done();
              });
            });

            afterEach(function(done) {
              FeatureModel.deleteFeaturesByCacheId(cache.id, function(count) {
                log.info('deleted %d %s features', count, cache.id);
                done();
              });
            });

            it('should generate the cache', function(done) {
              this.timeout(30000);
              f.generateCache(function(err, cache) {
                console.log('done', cache);
                done();
              }, function(cache, callback) {
                console.log('progress', cache);
                callback(null, cache);
              })
            });

            it('should pull features for the cache', function(done) {
              f.generateCache(function(err, cache) {
                console.log('done', cache);
                f.getDataWithin(-180, -85, 180, 85, 4326, function(err, features) {
                  if (err) {
                    done(err);
                    return;
                  }
                  features.length.should.equal(dataSource.testParams.featureCount);
                  done();
                });
              });
            });
            
            it('should generate the cache then download the format', function(done) {
              this.timeout(30000);
              f.generateCache(function(err, cache) {
                cache = cache.cache;
                console.log('done', cache);
                f.getData(cache.minZoom, cache.maxZoom, function(err, status) {
                  if (status.noData) return done();

                  should.exist(status.stream);

                  var ws = fs.createOutputStream(path.join('/tmp', 'export_'+dataSource.id+status.extension));
                  ws.on('close', function() {
                    done();
                  });
                  status.stream.pipe(ws);
                });
              }, function(cache, callback) {
                console.log('progress', cache);
                callback(null, cache);
              })
            });
            it('should generate the cache then delete the format', function(done) {
              this.timeout(30000);
              f.generateCache(function(err, cache) {
                console.log('done', cache);
                f.delete(done);
              }, function(cache, callback) {
                console.log('progress', cache);
                callback(null, cache);
              })
            });
          });
        });
      });
    });
  });
});
