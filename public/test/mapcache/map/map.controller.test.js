var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , sinonAsPromised = require('sinon-as-promised')
  , mocks = require('../../mocks');

require('angular-mocks');

describe('MapController completed map tests', function() {

  var scope;
  var ctrl;

  var CacheService;
  var CacheServiceMock;

  var MapService;
  var MapServiceMock;

  var sandbox;

  var $timeout;
  var $location;
  var getCachesExpectation;

  before(function() {
    require('../../../app/mapcache/map');
  });

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  beforeEach(function() {
    CacheService = require('../../../app/factories/cache.service')();
    CacheServiceMock = sandbox.mock(CacheService);
  });

  beforeEach(function() {
    MapService = require('../../../app/factories/map.service')();
    MapServiceMock = sandbox.mock(MapService);
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(function() {
    angular.mock.module(function($provide) {
      $provide.value('CacheService', CacheService);
      $provide.value('MapService', MapService);
    });
  });

  beforeEach(angular.mock.inject(function ($q) {
    sinonAsPromised($q);
  }));

  beforeEach(inject(function($rootScope, $controller, $injector){
    $timeout = $injector.get('$timeout');
    $location = $injector.get('$location');
    MapServiceMock.expects('refreshMap')
      .once()
      .withArgs({id:mocks.mapMocks.xyzMap.id})
      .yields(mocks.mapMocks.xyzMap);

    getCachesExpectation = MapServiceMock.expects('getCachesForMap');
    getCachesExpectation.withArgs(mocks.mapMocks.xyzMap)
      .yields(mocks.cacheMocks.completeCaches);

    scope = $rootScope.$new();
    ctrl = $controller('MapController', {$scope: scope, $routeParams: {
      mapId: mocks.mapMocks.xyzMap.id
    }});
  }));

  it('should create the MapController', function(done) {
    should.exist(ctrl);
    done();
  });

  it('should have loaded the map', function(done) {
    getCachesExpectation.once();
    scope.$apply();
    scope.map.should.be.equal(mocks.mapMocks.xyzMap);
    scope.mapComplete.should.be.equal(true);
    MapServiceMock.verify();
    done();
  });

  it('should have loaded the caches for the map', function(done) {
    getCachesExpectation.twice();
    scope.$apply();
    scope.caches.should.be.equal(mocks.cacheMocks.completeCaches);
    $timeout.flush(300000);
    MapServiceMock.verify();
    done();
  });

  it('should generate a cache format', function(done) {
    CacheServiceMock.expects('createCacheFormat')
      .once()
      .withArgs(mocks.cacheMocks.xyzCache, 'xyz')
      .callsArg(2);
    getCachesExpectation.twice();
    scope.$emit('generateFormat', mocks.cacheMocks.xyzCache, 'xyz');
    scope.$apply();
    scope.caches.should.be.equal(mocks.cacheMocks.completeCaches);
    MapServiceMock.verify();
    done();
  });

  it('should filter the caches', function(done) {
    scope.$emit('cacheFilterChange', {cacheFilter: 'XYZ'});
    scope.caches.length.should.be.equal(1);
    done();
  });

  it('should redirect to the create page with the mapid', function(done) {
    var spy = sinon.spy($location, 'path');
    scope.createCacheFromMap();
    spy.alwaysCalledWithExactly('/create/'+mocks.mapMocks.xyzMap.id).should.be.equal(true);
    spy.calledOnce.should.be.equal(true);
    done();
  });

});
