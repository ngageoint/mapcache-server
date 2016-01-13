var request = require('supertest')
  , mongoose = require('mongoose')
  , config = require('mapcache-config')
  , async = require('async')
  , Token = require('mapcache-models').Token
  , turf = require('turf')
  , fs = require('fs-extra')
  , TokenModel = mongoose.model('Token')
  , sinon = require('sinon')
  , Map = require('../../api/source')
  , Cache = require('../../api/cache')
  , app = require('../../express');

require('sinon-mongoose');
// require('chai').should();

describe("Cache Route Tests", function() {

  var sandbox;
  before(function() {
    sandbox = sinon.sandbox.create();
    var mongodbConfig = config.server.mongodb;

    var mongoUri = "mongodb://" + mongodbConfig.host + "/" + mongodbConfig.db;
    mongoose.connect(mongoUri, {server: {poolSize: mongodbConfig.poolSize}}, function(err) {
      if (err) {
        console.log('Error connecting to mongo database, please make sure mongodb is running...');
        throw err;
      }
    });
    mongoose.set('debug', true);
  });

  after(function(done) {
    mongoose.disconnect(function() {
      done();
    });
  });

  beforeEach(function() {
    var token = {
      _id: '1',
      token: '12345',
      userId: {
        populate: function(field, callback) {
          callback(null, {
            _id: '1',
            username: 'test',
            roleId: {
              permissions: ['CREATE_CACHE', 'READ_CACHE', 'DELETE_CACHE', 'EXPORT_CACHE']
            }
          });
        }
      }
    }

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

  describe("cache create tests", function() {

    var cacheId;

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
            url: 'http://osm.geointapps.org/osm',
            format: 'xyz',
            valid: true,
            name: 'http://osm.geointapps.org/osm'
          }],
          name: 'OSM' }
        )
        .expect(function(res) {
          map = res.body;
          mapId = map.id;
        })
        .end(done)
    });

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

    it("api should fail to create a cache because geometry is not specified", function(done) {

      request(app)
        .post('/api/caches')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect(400)
        .send({
          sourceId: mapId,
          minZoom: 0,
          maxZoom: 3,
          name: 'Cache'
        })
        .expect(function(res) {
          console.log(res);
        })
        .end(done);
    });

    it("api should create a cache", function(done) {

      request(app)
        .post('/api/caches')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect(200)
        .expect('Content-Type', /json/)
        .send({
          sourceId: mapId,
          minZoom: 0,
          maxZoom: 3,
          name: 'Cache',
          geometry: turf.bboxPolygon([-180, -85, 180, 85]).geometry
        })
        .expect(function(res) {
          var cache = res.body;
          cacheId = cache.id;
          cache.should.have.property('id');
          cache.should.have.property('name', 'Cache');
          cache.should.have.property('minZoom', 0);
          cache.should.have.property('maxZoom', 3);
          cache.should.have.property('status');
          console.log('cache', cache);
        })
        .end(done);
    });

    it("api should create a cache and generate a format", function(done) {
      this.timeout(10000);
      request(app)
        .post('/api/caches')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect(200)
        .expect('Content-Type', /json/)
        .send({
          sourceId: mapId,
          minZoom: 0,
          maxZoom: 3,
          name: 'Cache',
          create: ['xyz'],
          geometry: turf.bboxPolygon([-180, -85, 180, 85]).geometry
        })
        .expect(function(res) {
          var cache = res.body;
          cacheId = cache.id;
          cache.should.have.property('id');
          cache.should.have.property('name', 'Cache');
          cache.should.have.property('minZoom', 0);
          cache.should.have.property('maxZoom', 3);
          cache.should.have.property('status');
          console.log('cache', cache);
        })
        .end(function() {
          var finishedGenerating = false;
          console.log('until');
          async.until(
            function() { return finishedGenerating; },
            function(callback) {
              request(app)
                .get('/api/caches/'+cacheId)
                .set('Authorization', 'Bearer 12345')
                .expect(200)
                .expect(function(res) {
                  var cache = res.body;
                  if (!cache.status.complete) return;
                  cache.formats.should.have.property('xyz');
                  if (cache.formats.xyz.complete) {
                    cache.formats.xyz.should.have.property('generatedTiles', 85);
                    finishedGenerating = true;
                  }
                }).end(function() {
                  setTimeout(callback, 500);
                });
            },
            function() {
              done();
            }
          );
        });
    });
});

  describe("tests on existing cache", function() {
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
            url: 'http://osm.geointapps.org/osm',
            format: 'xyz',
            valid: true,
            name: 'http://osm.geointapps.org/osm'
          }],
          name: 'OSM' }
        )
        .expect(function(res) {
          map = res.body;
          mapId = map.id;
          console.log('map', map);
        })
        .end(function() {
          request(app)
            .post('/api/caches')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer 12345')
            .expect(200)
            .expect('Content-Type', /json/)
            .send({
              sourceId: mapId,
              minZoom: 0,
              maxZoom: 3,
              name: 'Cache',
              geometry: turf.bboxPolygon([-180, -85, 180, 85]).geometry
            })
            .expect(function(res) {
              var cache = res.body;
              cacheId = cache.id;
              cache.should.have.property('id');
              cache.should.have.property('name', 'Cache');
              cache.should.have.property('minZoom', 0);
              cache.should.have.property('maxZoom', 3);
              cache.should.have.property('status');
              console.log('cache', cache);
            })
            .end(done);
        })
    });

    afterEach(function(done) {
      if (!mapId) return done();
      Map.getById(mapId, function(err, map) {
        var m = new Map(map);
        m.delete(done);
      });
    });

    it ('should pull the cache', function(done) {
      request(app)
        .get('/api/caches/'+cacheId)
        .set('Authorization', 'Bearer 12345')
        .expect(200)
        .expect(function(res) {
          console.log('res', res.body);
          var cache = res.body;
          cacheId = cache.id;
          cache.should.have.property('id', cacheId);
          cache.should.have.property('name', 'Cache');
          cache.should.have.property('minZoom', 0);
          cache.should.have.property('maxZoom', 3);
          cache.should.have.property('status');
        })
        .end(done);
    });

    it ('should pull the 0/0/0 tile for the cache', function(done) {
      var file = fs.createWriteStream('/tmp/cache_test.png');
      file.on('close', done);
      request(app)
        .get('/api/caches/'+cacheId+'/0/0/0.png')
        .set('Authorization', 'Bearer 12345')
        .expect(200)
        .expect(function(res) {
          console.log('response body is', res);
        })
        .pipe(file);
    });

    it ('should generate an xyz cache', function(done) {
      this.timeout(10000);
      request(app)
        .get('/api/caches/'+cacheId + '/generate')
        .set('Authorization', 'Bearer 12345')
        .query({format: 'xyz'})
        .expect(202)
        .expect(function(res) {
          var cache = res.body;
          cache.should.have.property('id', cacheId);
          cache.should.have.property('name', 'Cache');
          cache.should.have.property('minZoom', 0);
          cache.should.have.property('maxZoom', 3);
          cache.should.have.property('status');
          cache.status.should.have.property('xyz');
          console.log(res.body);
        }).end(function() {
          var finishedGenerating = false;
          console.log('until');
          async.until(
            function() { return finishedGenerating; },
            function(callback) {
              request(app)
                .get('/api/caches/'+cacheId)
                .set('Authorization', 'Bearer 12345')
                .expect(200)
                .expect(function(res) {
                  var cache = res.body;
                  cache.formats.should.have.property('xyz');
                  if (cache.formats.xyz.complete) {
                    cache.formats.xyz.should.have.property('generatedTiles', 85);
                    finishedGenerating = true;
                  }
                }).end(function() {
                  setTimeout(callback, 500);
                });
            },
            function() {
              done();
            }
          );
        });
    });

    xit ('should pull the overview tile', function(done) {
      request(app)
        .get('/api/maps/'+mapId+'/overviewTile')
        .set('Authorization', 'Bearer 12345')
        .expect(200)
        .expect(function(res) {
          console.log('res', res);
        })
        .end(done);
    });

    xit ('should delete a datasource', function(done) {
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

    xit ('should delete the source', function(done) {
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
