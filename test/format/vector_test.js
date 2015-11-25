var turf = require('turf')
  , log = require('mapcache-log')
  , fs = require('fs-extra')
  , path = require('path')
  , async = require('async')
  , FeatureModel = require('mapcache-models').Feature
  , GeoJSON = require('../../format/geojson')
  , XYZ = require('../../format/xyz')
  , Map = require('../../map/map')
  , Cache = require('../../cache/cache');

var cacheModel = {
  id: 'test-cache',
  name: 'geojson test cache',
  geometry: turf.polygon([[
    [-180, -85],
    [-180, 85],
    [180, 85],
    [180, -85],
    [-180, -85]
  ]]),
  minZoom: 0,
  maxZoom: 1,
  formats: ['xyz', 'geojson']
};

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

describe('vectortests', function() {
  var osm;
  var land;
  var rivers;
  var map;

  before(function(done) {
    this.timeout(0);



    osm = {
      id: 'osm-ds',
      name: 'osm',
      url: 'http://osm.geointapps.org/osm',
      format: 'xyz',
      zOrder: 0
    };
    land = {
      id: 'land-ds',
      name: 'land',
      file: {
        path:__dirname + '/Land.geojson',
        name: 'Land.geojson'
      },
      format: 'geojson',
      zOrder: 1,
      style: {
        defaultStyle: {
          style: getRandomStyle()
        }
      }
    };

    rivers = {
      id: 'rivers-ds',
      name: 'rivers',
      file: {
        path:__dirname + '/Rivers.geojson',
        name: 'Rivers.geojson'
      },
      format: 'geojson',
      zOrder: 2,
      style: {
        defaultStyle: {
          style: getRandomStyle()
        }
      }
    };

    seaHexes = {
      id: 'seahexes-ds',
      name: 'seahexes',
      file: {
        path: '/data/maps/seahexes.json',
        name: 'seahexes'
      },
      format: 'geojson',
      zOrder: 1,
      style: {
        defaultStyle: {
          style: getRandomStyle()
        }
      }
    };

    landHexes = {
      id: 'landhexes-ds',
      name: 'landhexes',
      file: {
        path: '/data/maps/landhexes.json',
        name: 'landhexes'
      },
      format: 'geojson',
      zOrder: 1,
      style: {
        defaultStyle: {
          style: getRandomStyle()
        }
      }
    };

    async.eachSeries([rivers, land]/*, seaHexes, landHexes]*/, function(source, callback) {
      FeatureModel.deleteFeaturesBySourceId(source.id, function(count) {
        log.info('deleted %d %s features', count, source.id);
        callback();
      });
    }, function() {
      // map = new Map({
      //   outputDirectory: '/tmp',
      //   id: 'test-map',
      //   name: 'test-map',
      //   dataSources: [osm, land, rivers]
      // });
      // map.callbackWhenInitialized(function() {
      //   console.log('map initialized');
      //   done();
      // });


      // var mapString = JSON.stringify(hexMap, null, 2);
      // var ws = fs.createWriteStream('/tmp/hexmap.json');
      // var Readable = require('stream').Readable;
      // s = new Readable();
      // s.push(mapString);
      // s.push(null);
      //
      // s.pipe(ws);


      var stream = fs.createReadStream('/tmp/hexmap.json');
      log.info('reading in the file', '/tmp/hexmap.json');
      fs.readFile('/tmp/hexmap.json', function(err, fileData) {
        var gjData = JSON.parse(fileData);
        var datasources = [];
        for (var i = 0; i < gjData.map.dataSources.length; i++) {
          var s = gjData.map.dataSources[i].source;
          if (s.style) {
            s.style.defaultStyle.style = getRandomStyle();
          }
          datasources.push(s);
        }

        hexMap = new Map({
          outputDirectory: '/tmp/hexmap',
          id: 'hex-mappy',
          name: 'hex-map',
          dataSources: datasources
         });
         hexMap.callbackWhenInitialized(function() {
           log.info('hex map initialized');
           done();
         });
      });
    });
  });
  after(function(done) {
    this.timeout(0);
    async.eachSeries([rivers, land]/*, seaHexes, landHexes]*/, function(source, callback) {
      FeatureModel.deleteFeaturesBySourceId(source.id, function(count) {
        log.info('deleted %d %s features', count, source.id);
        callback();
      });
    }, function() {
      done();
    });
  });

  it('should pull a tile from the hex map', function (done) {
    this.timeout(0);

    // console.log('hexmap', JSON.stringify(hexMap, null, 2));

    // var mapString = JSON.stringify(hexMap, null, 2);
    // var ws = fs.createWriteStream('/tmp/hexmap.json');
    // var Readable = require('stream').Readable;
    // s = new Readable();
    // s.push(mapString);
    // s.push(null);
    //
    // s.pipe(ws);

    hexMap.getTile('png', 7, 22, 51, {noCache: true}, function(err, stream) {
      if (err) {
        done(err);
        return;
      }

      var ws = fs.createWriteStream('/tmp/hex_test.png');

      stream.pipe(ws);
      ws.on('finish', function() {
        done();
      });

    });
  });

  var cacheDir = '/tmp/testcaches';

  xdescribe('XYZ caching hexes', function() {
    var cacheName = 'hex-cache';

    before(function(done) {
      fs.remove(path.join(cacheDir, cacheName), callback);
    });

    after(function(done) {
      log.info('copy over the leaflet page', path.join(__dirname, '../leaflet/index.html'));
      fs.copy(path.join(__dirname, '../leaflet/index.html'), path.join(cacheDir, cacheName, 'index.html'), done);
    });

    it('should construct a hex tile XYZ cache', function (done) {
      this.timeout(0);

      cacheModel.source = hexMap;
      cacheModel.outputDirectory = cacheDir;

      cacheModel.id = cacheName;
      cacheModel.name = cacheName;
      cacheModel.cacheCreationParams = {
        noCache: false
      };

      var cache = new Cache(cacheModel);
      cache.callbackWhenInitialized(function(err, cache) {
        log.info('cache initialized');
        var xyzCache = new XYZ({cache: cache, outputDirectory: cacheModel.outputDirectory});
        log.info('xyzcache %s', xyzCache.cache.cache.name);
        xyzCache.generateCache(function(err, cache) {
          log.info('cache is done generating %s', cache.cache.name);
          done();
        },
        function(cache, callback) {
          log.info('progress on the cache %s', cache.name);
          callback(null, cache);
        });
      });
    });
  });

  describe('GeoJSON caching hexes', function() {
    var cacheName = 'hex-geojson-cache';

    before(function(done) {
      fs.remove(path.join(cacheDir, cacheName), done);
    });

    after(function(done) {
      FeatureModel.deleteFeaturesByCacheId(cacheName, function(count) {
        log.info('deleted %d %s features', count, cacheName);
        done();
      });
    });

    it('should construct a geojson cache', function (done) {
      this.timeout(0);

      cacheModel.source = hexMap;
      cacheModel.outputDirectory = cacheDir;
      cacheModel.id = cacheName;
      cacheModel.name = cacheName;
      cacheModel.cacheCreationParams = {
        noCache: false
      };
      cacheModel.geometry = turf.polygon([[
        [-120, 25],
        [-120, 30],
        [-109, 30],
        [-109, 25],
        [-120, 25]
      ]]);

      var cache = new Cache(cacheModel);
      cache.callbackWhenInitialized(function(err, cache) {
        try {
        log.info('cache initialized');

        var gjCache = new GeoJSON({cache: cache, outputDirectory: cacheModel.outputDirectory});

        log.info('geojson cache %s', gjCache.cache.cache.name);

        gjCache.generateCache(function(err, cache) {
          log.info('cache is done generating %s', cache.cache.name);
          done();
        },
        function(cache, callback) {
          log.info('progress on the cache %s', cache.status);
          callback(null, cache);
        });
      } catch(e) {
        console.error('error', e);
      }
      });
    });
  });

  xit('should pull a tile from the map', function (done) {
    this.timeout(0);

    map.getTile('png', 0, 0, 0, {noCache: true}, function(err, stream) {
      if (err) {
        done(err);
        return;
      }

      var ws = fs.createWriteStream('/tmp/vector_test.png');
      stream.pipe(ws);
      stream.on('end', function() {
        done();
      });

    });
  });

  xit('should construct a cache and pull the tile', function (done) {
    this.timeout(0);

    cacheModel.source = map;
    cacheModel.outputDirectory = '/tmp';

    var cache = new Cache(cacheModel);

    cache.getTile('png', 0, 0, 0, {noCache: true}, function(err, stream) {
      if (err) {
        done(err);
        return;
      }

      var ws = fs.createWriteStream('/tmp/vector_cache_test.png');
      stream.pipe(ws);
      stream.on('end', function() {
        done();
      });

    });
  });

  xit('should construct a cache and pull the tile with no rivers', function (done) {
    this.timeout(0);

    cacheModel.source = map;
    cacheModel.outputDirectory = '/tmp';
    cacheModel.cacheCreationParams = {
      dataSources: ['osm-ds', 'land-ds']
    };

    var cache = new Cache(cacheModel);

    cache.getTile('png', 0, 0, 0, {noCache: true}, function(err, stream) {
      if (err) {
        done(err);
        return;
      }

      var ws = fs.createWriteStream('/tmp/vector_cache_no_rivers_test.png');
      stream.pipe(ws);
      stream.on('end', function() {
        done();
      });

    });
  });

});
