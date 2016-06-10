var request = require('supertest')
  , mongoose = require('mongoose')
  , config = require('mapcache-config')
  , path = require('path')
  , colors = require('colors')
  , models = require('mapcache-models')
  , TokenModel = mongoose.model('Token')
  , sinon = require('sinon')
  , Map = require('../../api/source')
  , mocks = require('../../mocks')
  , app = require('../../express');

require('sinon-mongoose');
// require('chai').should();
//
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

describe("map route tests", function() {

  var sandbox;
  before(function(done) {
    sandbox = sinon.sandbox.create();
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

  var userId = mongoose.Types.ObjectId();

  beforeEach(function() {
    var token = {
      _id: '1',
      token: '12345',
      userId: {
        populate: function(field, callback) {
          callback(null, {
            _id: userId,
            username: 'test',
            roleId: {
              permissions: ['CREATE_CACHE', 'READ_CACHE', 'DELETE_CACHE']
            }
          });
        }
      }
    };

    sandbox.mock(TokenModel)
      .expects('findOne')
      .atLeast(0)
      .withArgs({token: "12345"})
      .chain('populate')
      .atLeast(0)
      .chain('exec')
      .atLeast(0)
      .yields(null, token);
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('tests', function() {
    TokenModel.findOne({token: "12345"}, function(err, token) {
    });
  });

  describe("map create tests", function() {

    var mapId;

    afterEach(function(done) {
      if (!mapId) return done();
      Map.getById(mapId, function(err, map) {
        var m = new Map(map);
        m.delete(done);
      });
    });

    it("api should create a map", function(done) {
      startTest("api should create a map");
      request(app)
        .post('/api/maps')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect(200)
        .expect('Content-Type', /json/)
        .send({
          dataSources: [{
            zOrder: 0,
            url: 'http://osm.geointservices.io/osm_tiles',
            format: 'xyz',
            valid: true,
            name: 'http://osm.geointservices.io/osm_tiles'
          }],
          name: 'OSM' }
        )
        .expect(function(res) {
          var source = res.body;
          mapId = source.id;
          source.should.have.property('userId', userId.toString());
          source.should.have.property('id');
          source.should.have.property('name');
          source.should.have.property('dataSources');
          source.dataSources[0].should.have.property('id');
        })
        .end(done);
    });

    it('should create a map with a wms source', function(done) {
      startTest('should create a map with a wms source');
      request(app)
        .post('/api/maps')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect(200)
        .expect('Content-Type', /json/)
        .send({
          "dataSources":[mocks.mapMocks.wmsDatasource],
          "name": "wms"
        })
        .expect(function(res) {
          var source = res.body;
          mapId = source.id;
          source.should.have.property('id');
          source.should.have.property('name');
          source.should.have.property('dataSources');
          source.dataSources[0].should.have.property('id');
        })
        .end(done);
    });

    it("api should create a map from a file", function(done) {
      startTest("api should create a map from a file");
      var mapJson = {
        dataSources: [{
          zOrder: 0,
          format: 'geojson',
          name: 'rivers',
          file: {
            name: 'maptest.geojson'
          }
        }],
        name: 'Rivers'
      };

      request(app)
        .post('/api/maps')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .attach('mapFile', path.join(__dirname, '../api/maptest.geojson'))
        .expect(200)
        .expect('Content-Type', /json/)
        .field('map', JSON.stringify(mapJson))
        .expect(function(res) {
          var source = res.body;
          mapId = source.id;
          source.should.have.property('id');
          source.should.have.property('name');
          source.should.have.property('dataSources');
          source.dataSources[0].should.have.property('id');
        })
        .end(done);
    });
  });

  describe("tests on existing map", function() {
    var mapId;
    var map;

    beforeEach(function(done) {
      request(app)
        .post('/api/maps')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect(200)
        .expect('Content-Type', /json/)
        .send({
          dataSources: [{
            zOrder: 0,
            url: 'http://osm.geointservices.io/osm_tiles',
            format: 'xyz',
            valid: true,
            name: 'http://osm.geointservices.io/osm_tiles'
          }],
          name: 'OSM' }
        )
        .expect(function(res) {
          map = res.body;
          mapId = map.id;
        })
        .end(done);
    });

    afterEach(function(done) {
      if (!mapId) return done();
      Map.getById(mapId, function(err, map) {
        if (map) {
          var m = new Map(map);
          m.delete(done);
        } else {
          done();
        }
      });
    });

    it ('should pull all of the maps', function(done) {
      startTest('should pull all of the maps');
      request(app)
        .get('/api/maps')
        .set('Authorization', 'Bearer 12345')
        .expect(200)
        .expect(function(res) {
          var maps = res.body;
          maps.length.should.be.greaterThan(0);
        })
        .end(done);
    });

    it ('should pull the 0/0/0 tile for the map', function(done) {
      startTest('should pull the 0/0/0 tile for the map');
      request(app)
        .get('/api/maps/'+mapId+'/0/0/0.png')
        .set('Authorization', 'Bearer 12345')
        .expect(200)
        .end(done);
    });

    it ('should pull the 0/0/0 tile for the map with sources url', function(done) {
      startTest('should pull the 0/0/0 tile for the map with sources url');
      request(app)
        .get('/api/sources/'+mapId+'/0/0/0.png')
        .set('Authorization', 'Bearer 12345')
        .expect(200)
        .end(done);
    });

    it ('should pull the map', function(done) {
      startTest('should pull the map');
      request(app)
        .get('/api/maps/'+mapId)
        .set('Authorization', 'Bearer 12345')
        .expect(200)
        .expect(function(res) {
          var map = res.body;
          map.should.have.property('name', 'OSM');
          map.should.have.property('status');
          map.should.have.property('id', mapId);
          map.should.have.property('mapcacheUrl', '/api/sources/'+mapId);
          map.should.have.property('dataSources');
          for (var i = 0; i < map.dataSources.length; i++) {
            map.dataSources[i].should.have.property('id');
          }
        })
        .end(done);
    });

    it ('should update the map', function(done) {
      startTest('should update the map');
      map.name = 'ChangedOSM';
      request(app)
        .put('/api/maps/'+mapId)
        .set('Authorization', 'Bearer 12345')
        .send(map)
        .expect(200)
        .expect(function(res) {
          var map = res.body;
          map.should.have.property('name', 'ChangedOSM');
          map.should.have.property('status');
          map.should.have.property('id', mapId);
          map.should.have.property('mapcacheUrl', '/api/sources/'+mapId);
          map.should.have.property('dataSources');
          for (var i = 0; i < map.dataSources.length; i++) {
            map.dataSources[i].should.have.property('id');
          }
        })
        .end(done);
    });

    it ('should pull the overview tile', function(done) {
      startTest('should pull the overview tile');
      request(app)
        .get('/api/maps/'+mapId+'/overviewTile')
        .set('Authorization', 'Bearer 12345')
        .expect(200)
        .expect(function(res) {
        })
        .end(done);
    });

    it ('should delete a datasource', function(done) {
      startTest('should delete a datasource');
      request(app)
        .delete('/api/maps/'+mapId+'/dataSources/'+map.dataSources[0].id)
        .set('Authorization', 'Bearer 12345')
        .expect(200)
        .expect(function(res) {
          var map = res.body;
          map.should.have.property('dataSources', []);
        })
        .end(done);
    });

    it ('should delete the source', function(done) {
      startTest('should delete the source');
      request(app)
        .delete('/api/maps/'+mapId)
        .set('Authorization', 'Bearer 12345')
        .expect(200)
        .expect(function(res) {
          var map = res.body;
          map.should.have.property('id', mapId);
          mapId = undefined;
        })
        .end(done);
    });

  });
});
