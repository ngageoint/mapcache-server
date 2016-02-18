var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , mocks = require('../../mocks');

require('angular-mocks');

describe('MapcacheCacheController tests', function() {

  var CacheService
    , getCacheExpectation
    , scope
    , ctrl
    , $location;

  var sandbox;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_CacheService_, $injector){
    $location = $injector.get('$location');
    CacheService = sandbox.mock(_CacheService_);
    getCacheExpectation = CacheService.expects('getCache');
    getCacheExpectation.yields(mocks.cacheMocks.xyzCache);
  }));

  beforeEach(inject(function($rootScope, $controller){
    scope = $rootScope.$new();
    ctrl = $controller('MapcacheCacheController', {$scope: scope, $routeParams: {
      cacheId: mocks.cacheMocks.xyzCache.id
    }});
  }));

  it('should create the MapcacheCacheController', function() {
    should.exist(ctrl);
    getCacheExpectation.once();
    scope.formatGenerating.should.be.equal(false);
    scope.hasVectorSources.should.be.equal(false);
    CacheService.verify();
  });

  it('should direct to /create', function() {
    var spy = sandbox.spy($location, 'path');

    scope.createAnotherCache();

    spy.calledOnce.should.be.equal(true);
    spy.alwaysCalledWithExactly('/create').should.be.equal(true);
  });

  it('should direct to /mapcache', function() {
    var spy = sandbox.spy($location, 'path');

    scope.returnToList();

    spy.calledOnce.should.be.equal(true);
    spy.alwaysCalledWithExactly('/mapcache').should.be.equal(true);
  });

  it('should generate a geopackage format', function(){
    CacheService.expects('createCacheFormat').withArgs(mocks.cacheMocks.xyzCache, 'geopackage').yields(mocks.cacheMocks.xyzCache);
    getCacheExpectation.twice();
    scope.generateFormat('geopackage');
    CacheService.verify();
  });

  it('should create tiles', function() {
    CacheService.expects('createCacheFormat').withArgs(mocks.cacheMocks.xyzCache, 'xyz').yields(mocks.cacheMocks.xyzCache);
    getCacheExpectation.twice();
    scope.createTiles(0,8);
    scope.cache.minZoom.should.be.equal(0);
    scope.cache.maxZoom.should.be.equal(8);
    CacheService.verify();
  });

  it('should calculate the cache size', function() {
    scope.calculateCacheSize(0, 1);
    scope.cache.totalCacheTiles.should.be.equal(8);
    scope.cache.totalCacheSize.should.be.equal(mocks.cacheMocks.xyzCache.source.tileSize*8);
    CacheService.verify();
  });

});
