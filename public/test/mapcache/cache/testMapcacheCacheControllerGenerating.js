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
    , $timeout;

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
    getCacheExpectation = CacheService.expects('getCache').yields(mocks.cacheMocks.generatingCache);
  }));

  beforeEach(inject(function($rootScope, $controller, _$timeout_){
    $timeout = _$timeout_;
    scope = $rootScope.$new();
    ctrl = $controller('MapcacheCacheController', {$scope: scope, $routeParams: {
      cacheId: mocks.cacheMocks.generatingCache.id
    }});
  }));

  it('should create the MapcacheCacheController with a generating cache', function() {
    getCacheExpectation.twice();
    should.exist(ctrl);
    scope.formatGenerating.should.be.equal(true);
    scope.hasVectorSources.should.be.equal(false);
    $timeout.flush(5001);
    CacheService.verify();
  });


});
