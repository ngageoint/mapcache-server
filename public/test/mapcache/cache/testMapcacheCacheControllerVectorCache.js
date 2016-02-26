var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , mocks = require('../../mocks');

require('angular-mocks');

describe('MapcacheCacheController tests', function() {

  var CacheService
    , scope
    , ctrl;

  var sandbox;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_CacheService_){
    CacheService = sandbox.mock(_CacheService_);
    CacheService.expects('getCache').yields(mocks.cacheMocks.xyzCacheWithVectorSources);
  }));

  beforeEach(inject(function($rootScope, $controller){
    scope = $rootScope.$new();
    ctrl = $controller('MapcacheCacheController', {$scope: scope, $routeParams: {
      cacheId: mocks.cacheMocks.xyzCacheWithVectorSources.id
    }});
  }));

  it('should create the MapcacheCacheController with a vector source cache', function() {
    should.exist(ctrl);
    scope.formatGenerating.should.be.equal(false);
    scope.hasVectorSources.should.be.equal(true);
    CacheService.verify();
  });


});
