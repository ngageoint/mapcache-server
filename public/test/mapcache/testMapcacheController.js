var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , sinonAsPromised = require('sinon-as-promised')
  , mocks = require('../mocks');

require('angular-mocks');

describe('MapcacheController tests', function() {

  var CacheService
    , getAllCachesExpectation
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
  }));

  beforeEach(angular.mock.inject(function ($q) {
    sinonAsPromised($q);
  }));

  beforeEach(function() {
    getAllCachesExpectation = CacheService.expects('getAllCaches').resolves(mocks.cacheMocks.caches);
  });

  beforeEach(inject(function($rootScope, $controller){
    scope = $rootScope.$new();
    ctrl = $controller('MapcacheController', {$scope: scope});
    scope.$apply();
  }));

  it('should create the MapcacheController', function() {
    getAllCachesExpectation.once();
    should.exist(ctrl);
    CacheService.verify();
  });

  it('should refresh the caches', function() {
    getAllCachesExpectation.twice();
    should.exist(ctrl);
    scope.$emit('refreshCaches');
    CacheService.verify();
  });

});
