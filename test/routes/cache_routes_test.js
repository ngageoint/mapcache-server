var should = require('should')
  , mongoose = require('mongoose')
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

describe('Cache Routes', function() {

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
        maxZoom: 1,
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

        Cache.create(cache, ['xyz'], function(err, cache) {
          if (err) console.log('err creating cache', err);
          createdCache = cache.cache;
          console.log('cache was created', cache);
          done();
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

        Cache.create(cache, ['geopackage'], function(err, cache) {
          if (err) console.log('err creating cache', err);
          createdCache = cache.cache;
          console.log('cache was created', cache);
          done();
        });
      });
    });

  });

});
