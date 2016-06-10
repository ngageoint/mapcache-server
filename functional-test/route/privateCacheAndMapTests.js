var request = require('supertest')
  , mongoose = require('mongoose')
  , config = require('mapcache-config')
  , turf = require('turf')
  , colors = require('colors')
  // this initializes the mongo models
  , models = require('mapcache-models') // jshint ignore:line
  , TokenModel = mongoose.model('Token')
  , sinon = require('sinon')
  , Map = require('../../api/source')
  , Cache = require('../../api/cache')
  , app = require('../../express');

require('sinon-mongoose');

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

describe("Private cache and map tests", function() {

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

  var userId1 = mongoose.Types.ObjectId();
  var userId2 = mongoose.Types.ObjectId();

  before(function() {
    var token1 = {
      _id: '1',
      token: '12345',
      userId: {
        populate: function(field, callback) {
          callback(null, {
            _id: userId1,
            username: 'test',
            roleId: {
              permissions: ['CREATE_CACHE', 'READ_CACHE', 'DELETE_CACHE', 'EXPORT_CACHE']
            }
          });
        }
      }
    };
    var token2 = {
      _id: '2',
      token: '67890',
      userId: {
        populate: function(field, callback) {
          callback(null, {
            _id: userId2,
            username: 'test2',
            roleId: {
              permissions: ['CREATE_CACHE', 'READ_CACHE', 'DELETE_CACHE', 'EXPORT_CACHE']
            }
          });
        }
      }
    };

    var mock = sandbox.mock(TokenModel);

    mock.expects('findOne')
      .atLeast(0)
      .withArgs({token: "12345"})
      .chain('populate')
      .atLeast(0)
      .chain('exec')
      .atLeast(0)
      .yields(null, token1);

    mock.expects('findOne')
        .atLeast(0)
        .withArgs({token: "67890"})
        .chain('populate')
        .atLeast(0)
        .chain('exec')
        .atLeast(0)
        .yields(null, token2);
  });

  after(function() {
    sandbox.restore();
  });

  var mapId;
  var map;
  var cacheId;

  afterEach(function(done) {
    if (!mapId) return done();
    Map.getById(mapId, function(err, map) {
      var m = new Map(map);
      m.delete(function() {
        if (!cacheId) return done();
        Cache.getById(cacheId, function(err, cache) {
          var c = new Cache(cache);
          c.delete(done);
        });
      });
    });
  });

  it('should create a map with one user and another user should not be able to see it', function(done) {
    startTest('should create a map with one user and another user should not be able to see it');
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
        name: 'OSM',
        permission: 'USER'
      })
      .expect(function(res) {
        map = res.body;
        mapId = map.id;
        map.should.have.property('id');
        map.should.have.property('userId', userId1.toString());
        map.should.have.property('permission', 'USER');
        map.should.have.property('name', 'OSM');
      })
      .end(function(err) {
        if (err) return done(err);
        request(app)
          .get('/api/maps/'+mapId)
          .set('Accept', 'application/json')
          .set('Authorization', 'Bearer 67890')
          .expect(404)
          .expect(function(res) {
          })
          .end(done);
      });
  });

  it('should create a map with one user and another user should be able to see it', function(done) {
    startTest('should create a map with one user and another user should be able to see it');
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
        permission: 'MAPCACHE',
        name: 'OSM' }
      )
      .expect(function(res) {
        map = res.body;
        mapId = map.id;
        map.should.have.property('id');
        map.should.have.property('userId', userId1.toString());
        map.should.have.property('permission', 'MAPCACHE');
        map.should.have.property('name', 'OSM');
      })
      .end(function(err) {
        if (err) return done(err);
        request(app)
          .get('/api/maps/'+mapId)
          .set('Accept', 'application/json')
          .set('Authorization', 'Bearer 67890')
          .expect(200)
          .expect('Content-Type', /json/)
          .end(done);
      });
  });

  it('should create a map with one user and another user should be able to see it since there is no permission', function(done) {
    startTest('should create a map with one user and another user should be able to see it since there is no permission');
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
        map.should.have.property('id');
        map.should.have.property('userId', userId1.toString());
        map.should.have.property('permission', 'MAPCACHE');
        map.should.have.property('name', 'OSM');
      })
      .end(function(err) {
        if(err) return done(err);
        request(app)
          .get('/api/maps/'+mapId)
          .set('Accept', 'application/json')
          .set('Authorization', 'Bearer 67890')
          .expect(200)
          .expect('Content-Type', /json/)
          .expect(function(res) {
          })
          .end(done);
      });
  });

  it('should create a map with one user and another user should not be able to see it in the list', function(done) {
    startTest('should create a map with one user and another user should not be able to see it in the list');
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
        name: 'OSM',
        permission: 'USER'
      })
      .expect(function(res) {
        map = res.body;
        mapId = map.id;
        map.should.have.property('id');
        map.should.have.property('userId', userId1.toString());
        map.should.have.property('permission', 'USER');
        map.should.have.property('name', 'OSM');
      })
      .end(function(err) {
        if (err) return done(err);
        request(app)
          .get('/api/maps/')
          .set('Accept', 'application/json')
          .set('Authorization', 'Bearer 67890')
          .expect(200)
          .expect(function(res) {
            var maps = res.body;
            for (var i = 0; i < maps.length; i++) {
              maps[i].should.not.have.property('id', map.id);
            }
          })
          .end(done);
      });
  });

  it('should create a map with one user and another user should be able to see it in the list', function(done) {
    startTest('should create a map with one user and another user should be able to see it in the list');
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
        permission: 'MAPCACHE',
        name: 'OSM' }
      )
      .expect(function(res) {
        map = res.body;
        mapId = map.id;
        map.should.have.property('id');
        map.should.have.property('userId', userId1.toString());
        map.should.have.property('permission', 'MAPCACHE');
        map.should.have.property('name', 'OSM');
      })
      .end(function(err) {
        if (err) return done(err);
        request(app)
          .get('/api/maps/')
          .set('Accept', 'application/json')
          .set('Authorization', 'Bearer 67890')
          .expect(200)
          .expect('Content-Type', /json/)
          .expect(function(res) {
            var maps = res.body;
            var found = false;
            for (var i = 0; i < maps.length && !found; i++) {
              found = map.id === maps[i].id;
            }
            found.should.be.equal(true);
          })
          .end(done);
      });
  });

  it('should create a map with one user and another user should be able to see it in the list since there is no permission', function(done) {
    startTest('should create a map with one user and another user should be able to see it in the list since there is no permission');
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
        map.should.have.property('id');
        map.should.have.property('userId', userId1.toString());
        map.should.have.property('permission', 'MAPCACHE');
        map.should.have.property('name', 'OSM');
      })
      .end(function(err) {
        if(err) return done(err);
        request(app)
          .get('/api/maps')
          .set('Accept', 'application/json')
          .set('Authorization', 'Bearer 67890')
          .expect(200)
          .expect('Content-Type', /json/)
          .expect(function(res) {
            var maps = res.body;
            var found = false;
            for (var i = 0; i < maps.length && !found; i++) {
              found = mapId === maps[i].id;
            }
            found.should.be.equal(true);
          })
          .end(done);
      });
  });




  it('should create a cache with one user and another user should not be able to see it', function(done) {
    startTest('should create a cache with one user and another user should not be able to see it');
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
      .end(function(err) {
        if (err) return done(err);
        request(app)
          .post('/api/caches')
          .set('Accept', 'application/json')
          .set('Authorization', 'Bearer 12345')
          .expect(200)
          .expect('Content-Type', /json/)
          .send({
            sourceId: mapId,
            minZoom: 0,
            maxZoom: 1,
            name: 'Cache',
            permission: 'USER',
            geometry: turf.bboxPolygon([-180, -85, 180, 85]).geometry
          })
          .expect(function(res) {
            var cache = res.body;
            cacheId = cache.id;
            cache.should.have.property('id');
            cache.should.have.property('userId', userId1.toString());
            cache.should.have.property('permission', 'USER');
            cache.should.have.property('name', 'Cache');
            cache.should.have.property('minZoom', 0);
            cache.should.have.property('maxZoom', 1);
            cache.should.have.property('status');
          })
          .end(function(err) {
            if (err) return done(err);
            request(app)
              .get('/api/caches/'+cacheId)
              .set('Accept', 'application/json')
              .set('Authorization', 'Bearer 67890')
              .expect(404)
              .expect(function(res) {
                console.log('res', res);
              })
              .end(done);
          });
      });
  });

  it('should create a cache with one user and another user should be able to see it', function(done) {
    startTest('should create a cache with one user and another user should be able to see it');
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
      .end(function(err) {
        if (err) return done(err);
        request(app)
          .post('/api/caches')
          .set('Accept', 'application/json')
          .set('Authorization', 'Bearer 12345')
          .expect(200)
          .expect('Content-Type', /json/)
          .send({
            sourceId: mapId,
            minZoom: 0,
            maxZoom: 1,
            name: 'Cache',
            permission: 'MAPCACHE',
            geometry: turf.bboxPolygon([-180, -85, 180, 85]).geometry
          })
          .expect(function(res) {
            var cache = res.body;
            cacheId = cache.id;
            cache.should.have.property('id');
            cache.should.have.property('userId', userId1.toString());
            cache.should.have.property('permission', 'MAPCACHE');
            cache.should.have.property('name', 'Cache');
            cache.should.have.property('minZoom', 0);
            cache.should.have.property('maxZoom', 1);
            cache.should.have.property('status');
          })
          .end(function(err) {
            if (err) return done(err);
            request(app)
              .get('/api/caches/'+cacheId)
              .set('Accept', 'application/json')
              .set('Authorization', 'Bearer 67890')
              .expect(200)
              .expect('Content-Type', /json/)
              .expect(function(res) {
                console.log('res', res);
              })
              .end(done);
          });
      });
  });

  it('should create a cache with one user and another user should be able to see it since there is no permission', function(done) {
    startTest('should create a cache with one user and another user should be able to see it since there is no permission');
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
      .end(function(err) {
        if (err) return done(err);
        request(app)
          .post('/api/caches')
          .set('Accept', 'application/json')
          .set('Authorization', 'Bearer 12345')
          .expect(200)
          .expect('Content-Type', /json/)
          .send({
            sourceId: mapId,
            minZoom: 0,
            maxZoom: 1,
            name: 'Cache',
            geometry: turf.bboxPolygon([-180, -85, 180, 85]).geometry
          })
          .expect(function(res) {
            var cache = res.body;
            cacheId = cache.id;
            cache.should.have.property('id');
            cache.should.have.property('userId', userId1.toString());
            cache.should.have.property('permission', 'MAPCACHE');
            cache.should.have.property('name', 'Cache');
            cache.should.have.property('minZoom', 0);
            cache.should.have.property('maxZoom', 1);
            cache.should.have.property('status');
          })
          .end(function(err) {
            if (err) return done(err);
            request(app)
              .get('/api/caches/'+cacheId)
              .set('Accept', 'application/json')
              .set('Authorization', 'Bearer 67890')
              .expect(200)
              .expect('Content-Type', /json/)
              .expect(function(res) {
                console.log('res', res);
              })
              .end(done);
          });
      });
  });


  it('should create a cache with one user and another user should not be able to see it in the list', function(done) {
    startTest('should create a cache with one user and another user should not be able to see it in the list');
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
      .end(function(err) {
        if (err) return done(err);
        request(app)
          .post('/api/caches')
          .set('Accept', 'application/json')
          .set('Authorization', 'Bearer 12345')
          .expect(200)
          .expect('Content-Type', /json/)
          .send({
            sourceId: mapId,
            minZoom: 0,
            maxZoom: 1,
            name: 'Cache',
            permission: 'USER',
            geometry: turf.bboxPolygon([-180, -85, 180, 85]).geometry
          })
          .expect(function(res) {
            var cache = res.body;
            cacheId = cache.id;
            cache.should.have.property('id');
            cache.should.have.property('userId', userId1.toString());
            cache.should.have.property('permission', 'USER');
            cache.should.have.property('name', 'Cache');
            cache.should.have.property('minZoom', 0);
            cache.should.have.property('maxZoom', 1);
            cache.should.have.property('status');
          })
          .end(function(err) {
            if (err) return done(err);
            request(app)
              .get('/api/caches')
              .set('Accept', 'application/json')
              .set('Authorization', 'Bearer 67890')
              .expect(200)
              .expect(function(res) {
                var caches = res.body;
                for (var i = 0; i < caches.length; i++) {
                  caches[i].should.not.have.property('id', cacheId);
                }
              })
              .end(done);
          });
      });
  });

  it('should create a cache with one user and another user should be able to see it in the list', function(done) {
    startTest('should create a cache with one user and another user should be able to see it in the list');
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
      .end(function(err) {
        if (err) return done(err);
        request(app)
          .post('/api/caches')
          .set('Accept', 'application/json')
          .set('Authorization', 'Bearer 12345')
          .expect(200)
          .expect('Content-Type', /json/)
          .send({
            sourceId: mapId,
            minZoom: 0,
            maxZoom: 1,
            name: 'Cache',
            permission: 'MAPCACHE',
            geometry: turf.bboxPolygon([-180, -85, 180, 85]).geometry
          })
          .expect(function(res) {
            var cache = res.body;
            cacheId = cache.id;
            cache.should.have.property('id');
            cache.should.have.property('userId', userId1.toString());
            cache.should.have.property('permission', 'MAPCACHE');
            cache.should.have.property('name', 'Cache');
            cache.should.have.property('minZoom', 0);
            cache.should.have.property('maxZoom', 1);
            cache.should.have.property('status');
          })
          .end(function(err) {
            if (err) return done(err);
            request(app)
              .get('/api/caches')
              .set('Accept', 'application/json')
              .set('Authorization', 'Bearer 67890')
              .expect(200)
              .expect('Content-Type', /json/)
              .expect(function(res) {
                var caches = res.body;
                var found = false;
                for (var i = 0; i < caches.length && !found; i++) {
                  found = cacheId === caches[i].id;
                }
                found.should.be.equal(true);
              })
              .end(done);
          });
      });
  });

  it('should create a cache with one user and another user should be able to see it in the list since there is no permission', function(done) {
    startTest('should create a cache with one user and another user should be able to see it in the list since there is no permission');
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
      .end(function(err) {
        if (err) return done(err);
        request(app)
          .post('/api/caches')
          .set('Accept', 'application/json')
          .set('Authorization', 'Bearer 12345')
          .expect(200)
          .expect('Content-Type', /json/)
          .send({
            sourceId: mapId,
            minZoom: 0,
            maxZoom: 1,
            name: 'Cache',
            geometry: turf.bboxPolygon([-180, -85, 180, 85]).geometry
          })
          .expect(function(res) {
            var cache = res.body;
            cacheId = cache.id;
            cache.should.have.property('id');
            cache.should.have.property('userId', userId1.toString());
            cache.should.have.property('permission', 'MAPCACHE');
            cache.should.have.property('name', 'Cache');
            cache.should.have.property('minZoom', 0);
            cache.should.have.property('maxZoom', 1);
            cache.should.have.property('status');
          })
          .end(function(err) {
            if (err) return done(err);
            request(app)
              .get('/api/caches')
              .set('Accept', 'application/json')
              .set('Authorization', 'Bearer 67890')
              .expect(200)
              .expect('Content-Type', /json/)
              .expect(function(res) {
                var caches = res.body;
                var found = false;
                for (var i = 0; i < caches.length && !found; i++) {
                  found = cacheId === caches[i].id;
                }
                found.should.be.equal(true);
              })
              .end(done);
          });
      });
  });
});
