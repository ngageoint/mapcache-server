var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , mocks = require('../mocks');

require('angular-mocks');

describe('Server Service tests', function() {

  var ServerService
    , $httpBackend;

  var sandbox;

  before(function() {
    require('../../app/mapcache/map');
  });

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_ServerService_, $injector){
    ServerService = _ServerService_;
    $httpBackend = $injector.get('$httpBackend');
  }));

  it('should create the ServerService', function() {
    should.exist(ServerService);
  });

  it('should get the server info', function(done) {
    $httpBackend.expect('GET', '/api/server')
      .respond(mocks.serverMocks.serverApi);

    ServerService.getServerInfo(function(success) {
      success.should.be.deep.equal(mocks.serverMocks.serverApi);
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should get the max cache size', function(done) {
    $httpBackend.expect('GET', '/api/server/maxCacheSize')
      .respond(mocks.serverMocks.maxCacheSize);

    ServerService.getMaxCacheSize(function(success) {
      success.should.be.deep.equal(mocks.serverMocks.maxCacheSize);
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });
});
