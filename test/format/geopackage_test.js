var assert = require('assert')
  , turf = require('turf')
  , async = require('async')
  , log = require('mapcache-log')
  , fs = require('fs-extra')
  , FeatureModel = require('mapcache-models').Feature
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

var datasource = {
  id: 'geopackage-ds',
  name: 'geopackage',
  format: 'geopackage',
  zOrder: 0
};

var osm = {
  id: 'osm-ds',
  name: 'osm',
  url: 'http://osm.geointapps.org/osm',
  format: 'xyz',
  zOrder: 0
};

var land = {
  id: 'land-ds',
  name: 'land',
  vector: true,
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

var rivers = {
  id: 'rivers-ds',
  name: 'rivers',
  vector: true,
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

var riversGeopackage = {
  id: 'rivers-gp',
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
  }
};

var map = {
  id: 'land-map',
  dataSources: [rivers, land, osm]
};

var cacheModel = {
  id: 'geopackage-cache',
  name: 'geopackage test cache',
  geometry: turf.polygon([[
    [-180, -85],
    [-180, 85],
    [180, 85],
    [180, -85],
    [-180, -85]
  ]]),
  minZoom: 0,
  maxZoom: 2,
  formats: ['geopackage']
};

var GeoPackage = require('../../format/geopackage');
var cacheDir = '/tmp/testcaches';

describe('Geo Package', function() {

  describe('Geo Package source tests', function() {
    var geoPackage = new GeoPackage({source: riversGeopackage, outputDirectory: '/tmp/geopackage-test'});

    before(function(done) {
      FeatureModel.deleteFeaturesBySourceId(riversGeopackage.id, function(count) {
        log.info('deleted %d %s features', count, riversGeopackage.id);
        done();
      });
    });

    it('should process the GeoPackage', function(done) {
      this.timeout(30000);
      geoPackage.processSource(function(err, source) {
        console.log('done processing source', source);
        console.log('err is', err);
        done();
      }, function(source, callback) {
        console.log('source processing progress', source);
        callback(null, source);
      });
    });

    it('should get a tile', function(done) {
      this.timeout(30000);
      geoPackage.getTile('png', 0, 0, 0, {}, function(err, stream) {
        var ws = fs.createWriteStream('/tmp/gp_test.png');

        stream.pipe(ws);
        ws.on('finish', function() {
          done();
        });
      });
    });
  });

  xdescribe('Geo Package cache tests', function() {
    var cacheName = 'gp-cache';

    var geopackage;
    var cache;
    before(function(done) {
      this.timeout(0);
      async.eachSeries([rivers, land], function(source, callback) {
        FeatureModel.deleteFeaturesBySourceId(source.id, function(count) {
          log.info('deleted %d %s features', count, source.id);
          callback();
        });
      }, function() {
        cacheModel.source = map;
        cacheModel.outputDirectory = cacheDir;

        cacheModel.id = cacheName;
        cacheModel.name = cacheName;
        cacheModel.cacheCreationParams = {
          noCache: false
        };
        cache = new Cache(cacheModel);
        cache.callbackWhenInitialized(function(err, cache) {
          log.info('cache initialized in test');
          geopackage = new GeoPackage({
            cache: cache,
            outputDirectory: cacheModel.outputDirectory
          });
          done();
        });
      });
    });
    after(function() {
    });
    it('should pull the 0/0/0 tile for the cache', function(done) {
      this.timeout(0);

      cache.getTile('png', 0, 0, 0, {noCache: true}, function(err, stream) {
        if (err) {
          done(err);
          return;
        }
        should.exist(stream);
        var ws = fs.createWriteStream('/tmp/geopackage_test.png');

        stream.pipe(ws);
        ws.on('finish', function() {
          done();
        });
      });
    });

    xit('should generate the cache', function(done) {
      this.timeout(0);
      geopackage.generateCache(function(err, cache) {
        console.log('err', err);
        log.info('cache is done generating %s', cache.cache.name);
        done();
      },
      function(cache, callback) {
        log.info('progress on the cache %s', cache.name, cache.status);
        callback(null, cache);
      });
    });
  });
});
