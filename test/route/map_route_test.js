var request = require('supertest')
  , mongoose = require('mongoose')
  , config = require('mapcache-config')
  , Token = require('mapcache-models').Token
  , TokenModel = mongoose.model('Token')
  , sinon = require('sinon')
  , app = require('../../express');

require('sinon-mongoose');
// require('chai').should();

describe("map route tests", function() {

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
              permissions: ['CREATE_CACHE']
            }
          });
        }
      }
    }

    sandbox.mock(TokenModel)
      .expects('findOne')
      .withArgs({token: "12345"})
      .chain('populate', 'userId')
      .chain('exec')
      .yields(null, token);
  });

  afterEach(function() {
    sandbox.restore();
  });

  it("api should return configuration", function(done) {

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
        var source = res.body;
        console.log('source', source);
        source.should.have.property('id');
        source.should.have.property('name');
        source.should.have.property('dataSources');
      })
      .end(done)
  });

});
