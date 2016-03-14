var turf = require('turf')
  , fs = require('fs-extra')
  , log = require('mapcache-log')
  , colors = require('colors')
  , xyzTileUtils = require('xyz-tile-utils')
  , FeatureModel = require('mapcache-models').Feature
  , path = require('path')
  , Cache = require('../../cache/cache')
  , mocks = require('../../mocks')
  , should = require('should');

function startTest(test) {
  console.log('Starting: '.white.bgRed.italic + test.white.bgBlue.bold);
}

function endTest(test) {
  console.log('Complete: '.white.bgRed.italic + test.white.bgBlue.bold);
}

function beforeTest(test) {
  console.log('Before: '.white.bgRed.italic + test.white.bgBlue.bold);
}

function afterTest(test) {
  console.log('After: '.white.bgRed.italic + test.white.bgBlue.bold);
}

function beforeEach(test) {
  console.log('Before Each: '.white.bgRed.italic + test.white.bgBlue.bold);
}

function afterEachTest(test) {
  console.log('After Each: '.white.bgRed.italic + test.white.bgBlue.bold);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function toHex(d) {
    return  ("0"+(Number(d).toString(16))).slice(-2).toUpperCase();
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
  };
}

var formatDataSources = [/*{
  id: 'test-xyz',
  name: 'osm',
  url: 'http://osm.geointapps.org/osm',
  format: 'xyz',
  zOrder: 0
},{
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
},
mocks.mapMocks.wmsDatasource,{
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
        beforeTest(dataSource.format + ' source tests');
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
        afterTest(dataSource.format + ' source tests');
        FeatureModel.deleteFeaturesBySourceId(dataSource.id, function(count) {
          log.info('deleted %d %s features', count, dataSource.id);
          done();
        });
      });
      it('should process the source ' + dataSource.id, function(done) {
        startTest('Process the source ' + dataSource.id);
        this.timeout(30000);
        f.processSource(function(err, newSource) {
          if(err) {
            return done(err);
          }
          newSource.status.message.should.equal("Complete");
          endTest('Process the source ' + dataSource.id);
          done();
        }, function(source, callback) {
          callback(null, source);
        });
      });
      it('should pull the 0/0/0 tile for the data source ' + dataSource.id, function(done) {
        this.timeout(10000);
        startTest('Pull the 0/0/0 tile for the data source ' + dataSource.id);
        f.getTile('png', 0, 0, 0, dataSource.testParams || {}, function(err, tileStream) {
          if (err) {
            console.log('there was an err', err);
            done(err);
            return;
          }

          should.exist(tileStream);

          var ws = fs.createOutputStream(path.join('/tmp', 'test_'+dataSource.id+'.png'));
          ws.on('close', function() {
            endTest('Pull the 0/0/0 tile for the data source ' + dataSource.id);
            done();
          });

          tileStream.pipe(ws);
        });
      });
      it('should pull a tile containing the extent of the geometry for source ' + dataSource.id, function(done) {
        this.timeout(10000);
        startTest('Pull a tile containing the extent of the geometry for source ' + dataSource.id);
        if (!dataSource.geometry) {
          return done(new Error('no geom for source ' + dataSource.format));
        }
        var xyz = xyzTileUtils.getXYZFullyEncompassingExtent(turf.extent(dataSource.geometry));
        f.getTile('png', xyz.z, xyz.x, xyz.y, dataSource.testParams || {}, function(err, tileStream) {
          if (err) {
            console.log('there was an err', err);
            done(err);
            return;
          }

          should.exist(tileStream);

          var ws = fs.createOutputStream(path.join('/tmp', 'test_extent_'+dataSource.id+'.png'));
          ws.on('close', function() {
            endTest('Pull a tile containing the extent of the geometry for source ' + dataSource.id);

            done();
          });

          tileStream.pipe(ws);
        });
      });

      it('should get all features of the source', function(done) {
        startTest('Get all features of the source ' + dataSource.id);
        f.getDataWithin(-179, -85, 179, 85, 4326, function(err, features) {
          console.log('err', err);
          if (err) {
            done(err);
            return;
          }

          if (dataSource.testParams && dataSource.testParams.featureCount) {
            features.length.should.be.equal(dataSource.testParams.featureCount);
          } else {
            features.length.should.be.equal(0);
          }
          endTest('Get all features of the source ' + dataSource.id);

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
        beforeTest('Check ' + dataSource.format + ' for ability to be a cache');
        try {
          f = new Format({
            cache: cacheObj,
            outputDirectory:cache.outputDirectory
          });
        } catch (e) {
        }
        done();

      });

      it ('should run tests if available for source ' + dataSource.format, function() {
        if (!f) return;
        describe(dataSource.format + ' cache tests if available', function() {

          before(function(done) {
            beforeTest(dataSource.format + ' cache tests');
            this.timeout(30000);
            FeatureModel.deleteFeaturesBySourceId(dataSource.id, function(count) {
              log.info('deleted %d %s features', count, dataSource.id);
              var cacheObj = new Cache(cache);
              cacheObj.callbackWhenInitialized(function(err, cacheObj) {
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

          after(function(done){
            afterTest(dataSource.format + ' cache tests');
            fs.remove(path.join(cache.outputDirectory, cache.id), function(err) {
              fs.remove(path.join(cache.outputDirectory, map.id), function(err) {
                FeatureModel.deleteFeaturesBySourceId(dataSource.id, function(count) {
                  log.info('deleted %d %s features', count, dataSource.id);
                  done();
                });
              });
            });
          });

          it('should pull the 0/0/0 tile for the cache', function(done) {
            startTest('should pull the 0/0/0 tile for the cache ' + dataSource.format);
            this.timeout(30000);
            f.getTile('png', 0, 0, 0, dataSource.params || {noCache: true}, function(err, stream) {
              if (err) {
                done(err);
                return;
              }

              should.exist(stream);

              var ws = fs.createOutputStream(path.join('/tmp', 'test_000_'+dataSource.id+'.png'));
              ws.on('close', function() {
                endTest('should pull the 0/0/0 tile for the cache ' + dataSource.format);
                done();
              });
              stream.pipe(ws);

            });
          });

          it.skip('should pull the 0/0/0 geojson tile for the cache if there is one', function(done) {
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

            it('should generate the cache', function(done) {
              startTest('Generate the cache ' + dataSource.format);
              this.timeout(30000);
              f.generateCache(function(err, cacheObj) {
                var cache = cacheObj.cache;
                should.exist(cache.formats);
                should.exist(cache.formats[dataSource.format]);
                should.exist(cache.formats[dataSource.format].size);
                endTest('Generate the cache ' + dataSource.format);
                done();
              }, function(cache, callback) {
                callback(null, cache);
              })
            });

            it('should pull features for the cache', function(done) {
              startTest('Pull features for the cache ' + dataSource.format);
              this.timeout(30000);
              f.generateCache(function(err, cache) {
                f.getDataWithin(-180, -85, 180, 85, 4326, function(err, features) {
                  if (err) {
                    done(err);
                    return;
                  }
                  features.length.should.equal(dataSource.testParams.featureCount);
                  endTest('Pull features for the cache ' + dataSource.format);
                  done();
                });
              });
            });

            it('should generate the cache then download the format', function(done) {
              startTest('Generate the cache then download the format ' + dataSource.format);
              this.timeout(30000);
              f.generateCache(function(err, cache) {
                cache = cache.cache;
                f.getData(cache.minZoom, cache.maxZoom, function(err, status) {
                  if (status.noData) return done();

                  should.exist(status.stream);

                  var ws = fs.createOutputStream(path.join('/tmp', 'export_'+dataSource.id+status.extension));
                  ws.on('close', function() {
                    endTest('Generate the cache then download the format ' + dataSource.format);
                    done();
                  });
                  status.stream.pipe(ws);
                });
              }, function(cache, callback) {
                callback(null, cache);
              })
            });
            it('should generate the cache then delete the format', function(done) {
              startTest('Generate the cache then delete the format ' + dataSource.format);
              this.timeout(30000);
              f.generateCache(function(err, cache) {
                f.delete(function() {
                  endTest('Generate the cache then delete the format ' + dataSource.format);
                  done();
                });
              }, function(cache, callback) {
                callback(null, cache);
              })
            });
          });
      });
    });
  });
});
