var should = require('should')
  , mongoose = require('mongoose')
  , async = require('async')
  , FeatureModel = require('mapcache-models').Feature
  , MapModel = require('mapcache-models').Map
  , fs = require('fs-extra')
  , path = require('path')
  , config = require('mapcache-config')
  , log = require('mapcache-log')
  , Map = require('../../api/source');

describe('Map API', function() {

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
    log.info('Getting all the maps');
    Map.getAll({}, function(err, maps) {
      if (err) {
        log.error('err', err);
      }
      log.info('got the maps');
      log.info('maps.length', maps.length);
      done();
    });
  });

  describe('create a map with no files', function() {
    var createdMap;
    after(function(done) {
      async.each(createdMap.dataSources, function(dataSource, callback) {
        FeatureModel.deleteFeaturesBySourceId(dataSource.id, function(err) {
          console.log('err is', err);
          callback();
        });
      }, function() {
        Map.getById(createdMap.id, function(err, map) {
          var m = new Map(map);
          m.delete(done);
        });
      });
    });

    it('should get create a map with no files', function(done) {
      log.info('Creating a map');

      var osmDataSource = {
        name: 'osm',
        url: 'http://osm.geointapps.org/osm',
        format: 'xyz',
        zOrder: 0
      };

      var mapboxDataSource = {
        name: 'mapbox',
        url: 'http://mapbox.geointapps.org:2999/v4/mapbox.light',
        format: 'xyz',
        zOrder: 1
      };

      var map = {
        name: 'Map Route Test',
        dataSources: [osmDataSource, mapboxDataSource]
      };

      Map.create(map, function(err, map) {
        log.info('Created a map %s with id %s', map.name, map.id);
        Map.getById(map.id, function(err, newMap) {
          createdMap = newMap;
          console.log('new map', JSON.stringify(newMap, null, 2));
          done();
        });
      });
    });

  });

  describe('create a map with files', function() {

    var createdMap;

    before(function(done) {
      fs.copy(path.join(__dirname, '../format/Rivers.geojson'), __dirname+'/maptest.geojson', function(err) {
        console.log('err', err);
        done();
      });
    });

    after(function(done) {
      async.each(createdMap.dataSources, function(dataSource, callback) {
        FeatureModel.deleteFeaturesBySourceId(dataSource.id, function(err) {
          console.log('err is', err);
          callback();
        });
      }, function() {
        Map.getById(createdMap.id, function(err, map) {
          var m = new Map(map);
          m.delete(done);
        });
      });
    });

    it('should get create a map with files', function(done) {

      log.info('Creating a map');

      var osmDataSource = {
        name: 'osm',
        url: 'http://osm.geointapps.org/osm',
        format: 'xyz',
        zOrder: 0
      };

      var riversDataSource = {
        name: 'rivers',
        file: {
          path: __dirname + '/maptest.geojson',
          name: 'maptest.geojson'
        },
        format: 'geojson',
        zOrder: 1
      };

      var map = {
        name: 'Map Route Test',
        dataSources: [osmDataSource, riversDataSource]
      };

      Map.create(map, function(err, newMap) {
        log.info('Created a map %s with id %s', newMap.name, newMap.id);
        Map.getById(newMap.id, function(err, newMap) {
          createdMap = newMap;
          console.log('new map', JSON.stringify(newMap, null, 2));
          done();
        });
      });
    });
  });

});
