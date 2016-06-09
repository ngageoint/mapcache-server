var should = require('should')
  , mongoose = require('mongoose')
  , async = require('async')
  , FeatureModel = require('mapcache-models').Feature
  , MapModel = require('mapcache-models').Map
  , fs = require('fs-extra')
  , path = require('path')
  , config = require('mapcache-config')
  , log = require('mapcache-log')
  , mocks = require('../../mocks')
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
      done();
    });
    mongoose.set('debug', true);
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
        url: 'http://osm.geointservices.io/osm_tiles',
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

  describe('create a map with multiple datasources', function() {
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

    var osmDataSource = {
      name: 'osm',
      url: 'http://osm.geointservices.io/osm_tiles',
      format: 'xyz',
      zOrder: 0
    };

    var riversDataSource = {
      name: 'geojson',
      file: {
        path: __dirname + '/maptest.geojson',
        name: 'maptest.geojson'
      },
      format: 'geojson',
      zOrder: 1
    };

    it('should create the map with multiple datasources', function(done) {
      var map = {
        name: 'Cache Route Test',
        dataSources: [osmDataSource, riversDataSource],
        tileSizeCount: 1,
        tileSize: 50
      };

      Map.create(map, function(err, newMap) {
        log.info('Created a map %s with id %s', newMap.name, newMap.id);
        Map.getById(newMap.id, function(err, newMap) {
          createdMap = newMap;
          // console.log(newMap.dataSources[1].properties);
          var mapCompare = JSON.parse(JSON.stringify(newMap));
          console.log('inserted map properties', mapCompare.dataSources[1].properties);
          var mapMock = JSON.parse(JSON.stringify(mocks.mapMocks.xyzMap));
          // console.log(mocks.mapMocks.xyzMap.dataSources[1].properties);
          console.log('mock map properties', mapMock.dataSources[1].properties);
          //compare newmap to map mock but without id properties
          delete mapCompare.id;
          delete mapMock.id;
          delete mapCompare.mapcacheUrl;
          delete mapMock.mapcacheUrl;
          delete mapCompare.humanReadableId;
          delete mapMock.humanReadableId;
          for (var i = 0; i < mapCompare.dataSources.length; i++) {
            delete mapCompare.dataSources[i].id;
            if (mapCompare.dataSources[i].file) {
              delete mapCompare.dataSources[i].file.path;
            }
          }
          for (var j = 0; j < mapMock.dataSources.length; j++) {
            delete mapMock.dataSources[j].id;
            if (mapMock.dataSources[j].file) {
              delete mapMock.dataSources[j].file.path;
            }
          }
          mapCompare.should.containDeep(mapMock);
          done();
        });
      });
    });
  });

  describe('create a map with files', function() {

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

    it('should get create a map with files', function(done) {

      log.info('Creating a map');

      var osmDataSource = {
        name: 'osm',
        url: 'http://osm.geointservices.io/osm_tiles',
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
