var GeoJSON = require('../../format/geojson')
  , Cache = require('../../cache/cache')
  , fs = require('fs-extra')
  , path = require('path')
  , should = require('chai').should()
  , tile = require('mapcache-tile')
  , os = require('os')
  , mongoose = require('mongoose')
  , sinon = require('sinon')
  , mockfs = require('mock-fs')
  , mockKnex = require('mock-knex')
  , mocks = require('../../mocks')
  , FeatureModel = require('mapcache-models').Feature
  , knexSetup = require('mapcache-models').knexSetup
  , knex = require('mapcache-models').knex;

describe('GeoJSON cache create tests', function() {

  var dataSource = {
    "name":"geojson",
    "format":"geojson",
    "id": "geojson",
    "file": {
      "path": '/mocks/features.geojson',
      "name": 'features.geojson'
    },
    status: {
      complete: true,
      failure: false,
      totalFeatures: mocks.mapMocks.featureMock.length
    },
    properties: [{
      "key": "a",
      "values": [
        "b"
      ]
    }],
    geometry: {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [28,58],
          [28,57.5],
          [28.5,57.5],
          [28.5,58],
          [28,58]
        ]]
      }
    },
    style: {
      defaultStyle: {
        style: {
          'fill': "#000000",
          'fill-opacity': 0.5,
          'stroke': "#0000FF",
          'stroke-opacity': 1.0,
          'stroke-width': 1
        }
      },
      styles: []
    }
  };

  var mockMap = {
    "name":"Cache Test",
    "humanReadableId":"4JbQ3GMte",
    "tilesLackExtensions":false,
    "status":{
      "message":"Completed map processing",
      "generatedFeatures":0,
      "totalFeatures":0,
      "generatedTiles":0,
      "totalTiles":0,
      "complete":true
    },
    "styleTime":1,
    "tileSize":50,
    "tileSizeCount":1,
    "dataSources":[dataSource],
    "id":"56a92d006a4c0e8d43c40194",
    "mapcacheUrl":"/api/sources/56a92d006a4c0e8d43c40194",
    "cacheTypes":[
      { required: false, type: 'geojson', vector: true },
      { required: false, type: 'shapefile', vector: true },
      { required: false, type: 'kml', vector: true },
      { required: false, type: 'xyz' },
      { depends: 'xyz', required: false, type: 'tms' },
      { depends: 'xyz', required: false, type: 'geopackage' }
    ]
  };

  var cacheId = mongoose.Types.ObjectId();

  var mockCache = {
    id: cacheId,
    name: 'createGeojsonCache',
    "geometry":{
      "type":"Feature",
      "geometry":{
        "type":"Polygon",
        "coordinates":[[[-180,-85],[-180,85],[180,85],[180,-85],[-180,-85]]]
      }
    },
    minZoom: 0,
    maxZoom: 1,
    source: mockMap
  };

  var cache;
  var cacheModel;
  var geojson;

  beforeEach(function() {
    cacheModel = JSON.parse(JSON.stringify(mockCache));
    cacheModel.outputDirectory = os.tmpdir();
  });

  var sandbox;
  var tracker;

  beforeEach(function(done) {
    mockKnex.mock(knexSetup.knex);
    knex(function() {
      fs.readFile(path.join(__dirname, '..','..','mocks','osm_0_0_0.png'), function (err, data) {
        var files = {
          '/mocks':{
            'zero_tile.png': data,
            'features.geojson': JSON.stringify({
              "type": "FeatureCollection",
              "features": mocks.mapMocks.featureMock
            })
          }
        };
        var cacheDir = path.join(os.tmpdir(), cacheId.toString(), 'geojson');
        console.log('cachedir', cacheDir);
        files[cacheDir] = {};
        mockfs(files);
        tracker = mockKnex.getTracker();
        tracker.install();
        done();
      });
    });
  });

  afterEach(function() {
    mockfs.restore();
    tracker.uninstall();
    mockKnex.unmock(knexSetup.knex);
  });

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });


  it('should create the format', function() {
    var cache = mockCache;
    var geojson = new GeoJSON({cache: cache, outputDirectory: os.tmpdir()});
  });

  it('should create the 0/0/0 tile from existing features', function(done) {

    var mockMapcacheTile = sandbox.mock(tile);
    mockMapcacheTile.expects('getVectorTile').once().yields(null, fs.createReadStream(path.join('/mocks', 'zero_tile.png')));

    var mockQueryResponder = sinon.stub();

    tracker.on('query', mockQueryResponder);

    mockQueryResponder.withArgs(sinon.match({
      bindings: [cacheId.toString(), 'geojson'],
      sql: 'select count(*) from "features" where "cache_id" = ? and "source_id" = ?'
    }))
    .onFirstCall().yieldsTo('response', [{count: ''+mocks.mapMocks.featureMock.length}]);

    cache = new Cache(cacheModel);
    cache.callbackWhenInitialized(function() {
      geojson = new GeoJSON({cache:cache, outputDirectory: os.tmpdir()});

      geojson.getTile('png', 0, 0, 0, null, function(err, tileRequest) {
        tileRequest.should.not.be.empty;
        tracker.queries.count().should.be.at.least(1);
        tracker.queries.count().should.be.at.most(2);
        mockMapcacheTile.verify();
        done();
      });
    });
  });

  it('should create the 0/0/0 geojson tile', function(done) {

    var mockMapcacheTile = sandbox.mock(tile);
    mockMapcacheTile.expects('getVectorTile').once().yields(null, fs.createReadStream(path.join('/mocks', 'features.geojson')));

    var mockQueryResponder = sinon.stub();

    tracker.on('query', mockQueryResponder);

    mockQueryResponder.withArgs(sinon.match({
      bindings: [cacheId.toString(), 'geojson'],
      sql: 'select count(*) from "features" where "cache_id" = ? and "source_id" = ?'
    }))
    .onFirstCall().yieldsTo('response', [{count: ''+mocks.mapMocks.featureMock.length}]);

    cache = new Cache(cacheModel);
    cache.callbackWhenInitialized(function() {
      geojson = new GeoJSON({cache:cache, outputDirectory: os.tmpdir()});

      geojson.getTile('geojson', 0, 0, 0, null, function(err, tileRequest) {
        tileRequest.should.not.be.empty;
        tracker.queries.count().should.be.at.least(1);
        tracker.queries.count().should.be.at.most(2);
        mockMapcacheTile.verify();
        done();
      });
    });
  });

  it('should create the 0/0/0 tile when features do not exist', function(done) {

    var mockMapcacheTile = sandbox.mock(tile);
    mockMapcacheTile.expects('getVectorTile').once().yields(null, fs.createReadStream(path.join('/mocks', 'zero_tile.png')));

    var mockQueryResponder = sinon.stub();

    tracker.on('query', mockQueryResponder);

    mockQueryResponder.withArgs(sinon.match({
      bindings: [cacheId.toString(), 'geojson'],
      sql: 'select count(*) from "features" where "cache_id" = ? and "source_id" = ?'
    }))
    .onFirstCall().yieldsTo('response', [{count: '0'}]);

    mockQueryResponder.withArgs(sinon.match({
      sql: 'WITH row AS (SELECT source_id, \''+cacheId.toString() +'\' as cache_id, box, geometry, properties FROM features WHERE source_id = \'geojson\' and cache_id is null and ST_Intersects(geometry, ST_Transform(ST_MakeEnvelope(-180,-85,180,85, 4326), 3857))) INSERT INTO features (source_id, cache_id, box, geometry, properties) (SELECT * from row)'
    }))
    .yieldsTo('response', {rowCount: ''+mocks.mapMocks.featureMock.length});

    cache = new Cache(cacheModel);
    cache.callbackWhenInitialized(function() {
      geojson = new GeoJSON({cache:cache, outputDirectory: os.tmpdir()});

      geojson.getTile('png', 0, 0, 0, null, function(err, tileRequest) {
        tileRequest.should.not.be.empty;
        tracker.queries.count().should.be.at.least(2);
        tracker.queries.count().should.be.at.most(3);
        mockMapcacheTile.verify();
        done();
      });
    });
  });

  it('should generate the cache', function(done) {
    var mockFeatureModel = sandbox.stub(FeatureModel, 'writeAllCacheFeatures', function(cacheId, file, format, callback) {
      fs.writeFile(file, 'test', callback);
    }).withArgs(cacheId.toString(), path.join(os.tmpdir(), cacheId.toString(), 'geojson', cacheId.toString()+'.geojson'), 'geojson');

    var mockQueryResponder = sinon.stub();

    tracker.on('query', mockQueryResponder);

    mockQueryResponder.withArgs(sinon.match({
      bindings: [cacheId.toString(), 'geojson'],
      sql: 'select count(*) from "features" where "cache_id" = ? and "source_id" = ?'
    }))
    .onFirstCall().yieldsTo('response', [{count: ''+mocks.mapMocks.featureMock.length}]);

    mockQueryResponder.withArgs(sinon.match({
      bindings: [cacheId.toString(), undefined],
      sql: 'select count(*) from "features" where "cache_id" = ? and "source_id" = ?'
    }))
    .onFirstCall().yieldsTo('response', [{count: ''+mocks.mapMocks.featureMock.length}]);

    cache = new Cache(cacheModel);
    cache.callbackWhenInitialized(function() {
      geojson = new GeoJSON({cache:cache, outputDirectory: os.tmpdir()});

      geojson.generateCache(function(err, finishedCache) {
        var cacheModel = finishedCache.cache;
        cacheModel.should.have.property('name', 'createGeojsonCache');
        cacheModel.formats.should.have.property('geojson');
        var geojson = cacheModel.formats.geojson;
        geojson.should.have.property('percentComplete', 100);
        geojson.should.have.property('complete', true);
        geojson.should.have.property('generatedFeatures', mocks.mapMocks.featureMock.length);
        geojson.should.have.property('size');
        done();
      }, function(cacheProgress, callback) {
        callback(null, cacheProgress);
      });
    });
  });

  it('should download the cache', function(done) {
    var mockFeatureModel = sandbox.stub(FeatureModel, 'writeAllCacheFeatures', function(cacheId, file, format, callback) {
      fs.writeFile(file, 'test', callback);
    }).withArgs(cacheId.toString(), path.join(os.tmpdir(), cacheId.toString(), 'geojson', cacheId.toString()+'.geojson'), 'geojson');

    var mockQueryResponder = sinon.stub();

    tracker.on('query', mockQueryResponder);

    mockQueryResponder.withArgs(sinon.match({
      bindings: [cacheId.toString(), 'geojson'],
      sql: 'select count(*) from "features" where "cache_id" = ? and "source_id" = ?'
    }))
    .onFirstCall().yieldsTo('response', [{count: ''+mocks.mapMocks.featureMock.length}]);

    mockQueryResponder.withArgs(sinon.match({
      bindings: [cacheId.toString(), undefined],
      sql: 'select count(*) from "features" where "cache_id" = ? and "source_id" = ?'
    }))
    .onFirstCall().yieldsTo('response', [{count: ''+mocks.mapMocks.featureMock.length}]);

    cache = new Cache(cacheModel);
    cache.callbackWhenInitialized(function() {
      geojson = new GeoJSON({cache:cache, outputDirectory: os.tmpdir()});

      geojson.generateCache(function(err, finishedCache) {
        var cacheModel = finishedCache.cache;
        cacheModel.should.have.property('name', 'createGeojsonCache');
        cacheModel.formats.should.have.property('geojson');
        var format = cacheModel.formats.geojson;
        format.should.have.property('percentComplete', 100);
        format.should.have.property('complete', true);
        format.should.have.property('generatedFeatures', mocks.mapMocks.featureMock.length);
        format.should.have.property('size');
        geojson.getData(0,0, function(err, dataResult) {
          dataResult.should.have.property('stream');
          dataResult.should.have.property('extension', '.geojson');
          done();
        });
      }, function(cacheProgress, callback) {
        callback(null, cacheProgress);
      });
    });
  });

  it('should delete the cache', function(done) {
    var mockFeatureModel = sandbox.stub(FeatureModel, 'writeAllCacheFeatures', function(cacheId, file, format, callback) {
      fs.writeFile(file, 'test', callback);
    }).withArgs(cacheId.toString(), path.join(os.tmpdir(), cacheId.toString(), 'geojson', cacheId.toString()+'.geojson'), 'geojson');

    var mockQueryResponder = sinon.stub();

    tracker.on('query', mockQueryResponder);

    mockQueryResponder.withArgs(sinon.match({
      bindings: [cacheId.toString(), 'geojson'],
      sql: 'select count(*) from "features" where "cache_id" = ? and "source_id" = ?'
    }))
    .onFirstCall().yieldsTo('response', [{count: ''+mocks.mapMocks.featureMock.length}]);

    mockQueryResponder.withArgs(sinon.match({
      bindings: [cacheId.toString(), undefined],
      sql: 'select count(*) from "features" where "cache_id" = ? and "source_id" = ?'
    }))
    .onFirstCall().yieldsTo('response', [{count: ''+mocks.mapMocks.featureMock.length}]);

    cache = new Cache(cacheModel);
    cache.callbackWhenInitialized(function() {
      geojson = new GeoJSON({cache:cache, outputDirectory: os.tmpdir()});

      geojson.generateCache(function(err, finishedCache) {
        var cacheModel = finishedCache.cache;
        cacheModel.should.have.property('name', 'createGeojsonCache');
        cacheModel.formats.should.have.property('geojson');
        var format = cacheModel.formats.geojson;
        format.should.have.property('percentComplete', 100);
        format.should.have.property('complete', true);
        format.should.have.property('generatedFeatures', mocks.mapMocks.featureMock.length);
        format.should.have.property('size');
        fs.stat(path.join(os.tmpdir(), cacheId.toString(), 'geojson', cacheId.toString() +'.geojson'), function(err, stats) {
          stats.isFile().should.be.equal(true);
          geojson.delete(function() {
            fs.stat(path.join(os.tmpdir(), cacheId.toString(), 'geojson', cacheId.toString() +'.geojson'), function(err, stats) {
              err.should.have.property('errno', 34);
              done();
            });
          });
        });
      }, function(cacheProgress, callback) {
        callback(null, cacheProgress);
      });
    });
  });
});
