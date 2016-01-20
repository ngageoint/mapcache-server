var should = require('should')
  , mongoose = require('mongoose')
  , expect = require('chai').expect
  , async = require('async')
  , FeatureModel = require('mapcache-models').Feature
  , CacheModel = require('mapcache-models').Cache
  , MapModel = require('mapcache-models').Map
  , fs = require('fs-extra')
  , path = require('path')
  , turf = require('turf')
  , config = require('mapcache-config')
  , log = require('mapcache-log')
  , Cache = require('../../api/cache')
  , Map = require('../../api/source');

describe('Cache API', function() {

  before(function(done) {
    var mongodbConfig = config.server.mongodb;

    var mongoUri = "mongodb://" + mongodbConfig.host + "/" + mongodbConfig.db;
    mongoose.connect(mongoUri, {server: {poolSize: mongodbConfig.poolSize}}, function(err) {
      if (err) {
        console.log('Error connecting to mongo database, please make sure mongodb is running...');
        throw err;
      }
    });
    mongoose.set('debug', true);

    done();
  });

  after(function(done) {
    mongoose.disconnect(function() {
      done();
    });
  });

  it('should get all maps', function(done) {
    log.info('Getting all the caches');
    Cache.getAll({}, function(err, caches) {
      if (err) {
        log.error('err', err);
      }
      log.info('got the maps');
      log.info('caches.length', caches.length);
      done();
    });
  });

  describe('create an xyz cache', function() {
    var createdCache;
    var createdMap;
    after(function(done) {
      new Cache(createdCache).delete(function(err, cache) {
        Map.getById(createdMap.id, function(err, map) {
          new Map(map).delete(done);
        });
      });
    });

    it('should get create an xyz cache', function(done) {
      this.timeout(0);
      var osmDataSource = {
        name: 'osm',
        url: 'http://osm.geointapps.org/osm',
        format: 'xyz',
        zOrder: 0
      };

      var map = {
        name: 'Cache Route Test',
        dataSources: [osmDataSource]
      };

      var cache = {
        name: 'XYZ',
        minZoom: 0,
        maxZoom: 3,
        geometry: turf.polygon([[
          [-180, -85],
          [-180, 85],
          [180, 85],
          [180, -85],
          [-180, -85]
        ]]).geometry
      };

      Map.create(map, function(err, map) {
        createdMap = map;
        log.info('Created a map %s with id %s', map.name, map.id);
        cache.source = map;
        cache.create = ['xyz'];

        Cache.create(cache, function(err, cache) {
          if (err) console.log('err creating cache', err);
          console.log('Created Cache', cache);
          createdCache = cache;
          expect(cache.formats.xyz).to.have.property('complete', true);
          expect(cache.formats.xyz).to.have.property('generatedTiles', 85);
          expect(cache.formats.xyz).to.have.property('totalTiles', 85);
          CacheModel.getCacheById(cache.id, function(err, cache) {
            log.info('cache was created', JSON.stringify(cache, null, 2));
            done();
          });
        }, function(err, cache) {
          console.log('Cache progress', cache);
        });
      });
    });
  });

  describe.skip('(Skipped until we support caches of any feature type) create an xyz cache with non normalized bounds', function() {
    var createdCache;
    var createdMap;
    after(function(done) {
      new Cache(createdCache).delete(function(err, cache) {
        Map.getById(createdMap.id, function(err, map) {
          new Map(map).delete(done);
        });
      });
    });

    it('should get create an xyz cache', function(done) {
      this.timeout(0);
      var osmDataSource = {
        name: 'osm',
        url: 'http://osm.geointapps.org/osm',
        format: 'xyz',
        zOrder: 0
      };

      var map = {
        name: 'Cache Route Test',
        dataSources: [osmDataSource]
      };

      var cache = {
        name: 'XYZ',
        minZoom: 0,
        maxZoom: 3,
        geometry: turf.polygon([[
          [-250, -85],
          [-250, 85],
          [-181, 85],
          [-181, -85],
          [-250, -85]
        ]]).geometry
      };

      Map.create(map, function(err, map) {
        createdMap = map;
        log.info('Created a map %s with id %s', map.name, map.id);
        cache.source = map;
        cache.create = ['xyz'];

        Cache.create(cache, function(err, cache) {
          if (err) console.log('err creating cache', err);
          console.log('Created Cache', cache);
          createdCache = cache;
          expect(cache.formats.xyz).to.have.property('complete', true);
          expect(cache.formats.xyz).to.have.property('generatedTiles', 85);
          expect(cache.formats.xyz).to.have.property('totalTiles', 85);
          CacheModel.getCacheById(cache.id, function(err, cache) {
            log.info('cache was created', JSON.stringify(cache, null, 2));
            done();
          });
        }, function(err, cache) {
          console.log('Cache progress', cache);
        });
      });
    });
  });

  describe('create a GeoPackage cache', function() {
    var createdCache;
    var createdMap;
    after(function(done) {
      new Cache(createdCache).delete(function(err, cache) {
        Map.getById(createdMap.id, function(err, map) {
          new Map(map).delete(done);
        });
      });
    });

    it('should get create a GeoPackage cache', function(done) {
      this.timeout(0);
      var osmDataSource = {
        name: 'osm',
        url: 'http://osm.geointapps.org/osm',
        format: 'xyz',
        zOrder: 0
      };

      var map = {
        name: 'Cache Route Test',
        dataSources: [osmDataSource]
      };

      var cache = {
        name: 'XYZ',
        minZoom: 0,
        maxZoom: 3,
        geometry: turf.polygon([[
          [-180, -85],
          [-180, 85],
          [180, 85],
          [180, -85],
          [-180, -85]
        ]]).geometry
      };

      Map.create(map, function(err, map) {
        createdMap = map;
        log.info('Created a map %s with id %s', map.name, map.id);
        cache.source = map;
        cache.create = ['geopackage'];

        Cache.create(cache, function(err, cache) {
          if (err) console.log('err creating cache', err);
          createdCache = cache;
          log.info('cache was created', JSON.stringify(cache, null, 2));
          done();
        });
      });
    });

  });

  describe('xyz cache with null in the cache creation params data source array', function() {
    var map = {
      "name":"OSM",
      "styleTime":1,
      "tileSize":0,
      "dataSources":[{
        "geometry":{
          "type":"Feature","geometry":{"type":"Polygon","coordinates":[[[180,-85],[-180,-85],[-180,85],[180,85],[180,-85]]]}
        },
        "url":"http://osm.geointapps.org/osm",
        "name":"OSM",
        "format":"xyz",
        "zOrder":0
      }]
    };
    var cache  = {
      "geometry": {
        "type":"Polygon",
        "coordinates":[
          [[-108.80859375,35.460669951495305],[-108.80859375,42.293564192170095],[-99.140625,42.293564192170095],[-99.140625,35.460669951495305],[-108.80859375,35.460669951495305]]]
        },
        "name":"OSM1",
        "cacheCreationParams":{
          "dataSources":[null]
        },
        "tileSizeLimit":2147483648,
        "vector":false,
        "minZoom":0,
        "maxZoom":5
    };

    var createdCache;
    var createdMap;

    after(function(done) {
      new Cache(createdCache).delete(function(err, cache) {
        Map.getById(createdMap.id, function(err, map) {
          new Map(map).delete(done);
        });
      });
    });

    before(function(done) {
      Map.create(map, function(err, map) {
        createdMap = map;
        log.info('Created a map %s with id %s', map.name, map.id);
        cache.source = map;
        cache.create = ['xyz'];

        Cache.create(cache, function(err, cache) {
          if (err) console.log('err creating cache', err);
          createdCache = cache;
          log.info('cache was created', JSON.stringify(cache, null, 2));
          done();
        });
      });
    });

    it('should pull the 0/0/0 tile', function(done) {
      var c = new Cache(createdCache);
      c.getTile('png', 0, 0, 0, {}, function(err, stream) {
        var imageFile = path.join('/tmp', 'cache_test.png');
        var ws = fs.createOutputStream(imageFile);
        ws.on('close', function() {
          var imageDiff = require('image-diff');
          imageDiff({
            actualImage: imageFile,
            expectedImage: __dirname + '/osm_0_0_0.png',
            diffImage: '/tmp/difference.png',
          }, function (err, imagesAreSame) {
            console.log('images the same? ', imagesAreSame);
            console.log('err', err);
            should.not.exist(err);
            imagesAreSame.should.be.true();
            done();
          });
        });

        stream.pipe(ws);
      });
    });

    it('should not have a 5/5/11 tile', function(done) {
      var c = new Cache(createdCache);
      c.getTile('png', 5, 5, 11, {}, function(err, stream) {
        should.not.exist(stream);
        done();
      });
    });
  });

});
