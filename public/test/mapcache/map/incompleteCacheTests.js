

var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , sinonAsPromised = require('sinon-as-promised')
  , mocks = require('../../mocks');

require('angular-mocks');

describe('MapController incomplete cache tests', function() {

  var scope;
  var ctrl;

  var CacheService;
  var CacheServiceMock;

  var MapService;
  var MapServiceMock;

  var $timeout;

  var sandbox;

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

  var getCachesExpectation;

  beforeEach(inject(function($rootScope, $controller, $injector){
    $timeout = $injector.get('$timeout');
    MapServiceMock.expects('getMap')
      .once()
      .withArgs({id:mocks.mapMocks.xyzMap.id})
      .yields(mocks.mapMocks.xyzMap);

    getCachesExpectation = MapServiceMock.expects('getCachesForMap');
    getCachesExpectation.withArgs(mocks.mapMocks.xyzMap)
      .yields(mocks.cacheMocks.caches);

    scope = $rootScope.$new();
    ctrl = $controller('MapController', {$scope: scope, $timeout: $timeout, $routeParams: {
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
    scope.caches.should.be.equal(mocks.cacheMocks.caches);
    $timeout.flush(30000);
    MapServiceMock.verify();
    done();
  });

});
