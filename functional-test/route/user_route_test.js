var request = require('supertest')
  , mongoose = require('mongoose')
  , config = require('mapcache-config')
  , models = require('mapcache-models')
  , sinon = require('sinon')
  , app = require('../../express');

require('sinon-mongoose');
// require('chai').should();

describe("user route tests", function() {

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

  afterEach(function() {
    sandbox.restore();
  });

  it.skip('should log in', function(done) {
    request(app)
      .post('/api/login')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .send({
        username:'admin',
        password:'password',
        appVersion:'Web Client'
      })
      .expect(function(res) {
        console.log('res.body', res.body);
      })
      .end(done);
  });

});
