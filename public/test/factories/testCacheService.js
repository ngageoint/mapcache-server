var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , mocks = require('../mocks');

require('angular-mocks');

describe('Cache Service tests', function() {

  var CacheService
    , $httpBackend;

  var sandbox;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_CacheService_, $injector){
    CacheService = _CacheService_;
    $httpBackend = $injector.get('$httpBackend');
  }));

  it('should create the CacheService', function() {
    should.exist(CacheService);
  });

  it('should get all the caches', function(done) {
    $httpBackend.expect('GET', '/api/caches')
      .respond(mocks.cacheMocks.caches);

    CacheService.getAllCaches().then(function(success) {
      success.should.be.deep.equal(mocks.cacheMocks.caches);
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should get the cache', function(done) {
    $httpBackend.expect('GET', '/api/caches/'+mocks.cacheMocks.xyzCache.id)
      .respond(mocks.cacheMocks.xyzCache);

    CacheService.getCache({id: mocks.cacheMocks.xyzCache.id}, function(success) {
      success.should.be.deep.equal(mocks.cacheMocks.xyzCache);
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should fail to get the cache', function(done) {
    $httpBackend.expect('GET', '/api/caches/'+mocks.cacheMocks.xyzCache.id)
      .respond(404, 'Cache not found');

    CacheService.getCache({id: mocks.cacheMocks.xyzCache.id}, function() {

    }, function(error) {
      error.should.be.equal('Cache not found');
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should delete the cache', function(done) {
    $httpBackend.expect('DELETE', '/api/caches/'+mocks.cacheMocks.xyzCache.id)
      .respond(mocks.cacheMocks.xyzCache);

    CacheService.deleteCache({id: mocks.cacheMocks.xyzCache.id}, function(success) {
      success.should.be.deep.equal(mocks.cacheMocks.xyzCache);
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should delete the cache format', function(done) {
    $httpBackend.expect('DELETE', '/api/caches/'+mocks.cacheMocks.xyzCache.id+'/xyz')
      .respond(mocks.cacheMocks.xyzCache);

    CacheService.deleteCache({id: mocks.cacheMocks.xyzCache.id}, 'xyz', function(success) {
      success.should.be.deep.equal(mocks.cacheMocks.xyzCache);
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should fail to delete the cache format', function(done) {
    $httpBackend.expect('DELETE', '/api/caches/'+mocks.cacheMocks.xyzCache.id+'/xyz')
      .respond(503, 'deletion failed');

    CacheService.deleteCache({id: mocks.cacheMocks.xyzCache.id}, 'xyz', function() {
    }, function(failure) {
      failure.status.should.be.equal(503);
      failure.data.should.be.equal('deletion failed');
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should create the cache format', function(done) {
    var cache = mocks.cacheMocks.xyzCache;
    $httpBackend.expect('GET', '/api/caches/'+cache.id+'/generate?format=xyz&maxZoom=3&minZoom=0').respond(mocks.cacheMocks.xyzCache);

    CacheService.createCacheFormat(cache, 'xyz', function(success) {
      success.should.be.deep.equal(mocks.cacheMocks.xyzCache);
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should create the cache', function(done) {
    var cache = mocks.cacheMocks.xyzCache;
    $httpBackend.expect('POST', '/api/caches')
      .respond(mocks.cacheMocks.xyzCache);

    CacheService.createCache(cache, function(success) {
      success.should.be.deep.equal(mocks.cacheMocks.xyzCache);
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should fail to create the cache', function(done) {
    var cache = mocks.cacheMocks.xyzCache;
    $httpBackend.expect('POST', '/api/caches')
      .respond(503, 'Server failure');

    CacheService.createCache(cache, function(success) {
    }, function(error) {
      error.data.should.be.equal('Server failure');
      error.status.should.be.equal(503);
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should get the cache data', function(done) {
    var cache = mocks.cacheMocks.xyzCache;
    $httpBackend.expect('GET', '/api/caches/'+cache.id+'/xyz?minZoom=0&maxZoom=18')
      .respond({test:5});

    CacheService.getCacheData(cache, 'xyz', function(success) {
      success.should.be.deep.equal({test:5});
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should fail to get cache data', function(done) {
    var cache = mocks.cacheMocks.xyzCache;
    $httpBackend.expect('GET', '/api/caches/'+cache.id+'/xyz?minZoom=0&maxZoom=18')
      .respond(503, 'Server failure');

    CacheService.getCacheData(cache, 'xyz', function() {
    }, function(error, status) {
      error.should.be.equal('Server failure');
      status.should.be.equal(503);
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should restart the cache', function() {
    var cache = mocks.cacheMocks.xyzCache;
    $httpBackend.expect('GET', '/api/caches/'+cache.id+'/restart')
      .respond(mocks.cacheMocks.xyzCache);

    CacheService.downloadMissing(mocks.cacheMocks.xyzCache);

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });
});
