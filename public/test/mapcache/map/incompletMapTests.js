

var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , sinonAsPromised = require('sinon-as-promised')
  , mocks = require('../../mocks');

require('angular-mocks');

describe('MapController incomplete map tests', function() {

  var scope;
  var ctrl;

  var CacheService;
  var CacheServiceMock;

  var MapService;
  var MapServiceMock;

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

  beforeEach(inject(function($rootScope, $controller){
    MapServiceMock.expects('getMap')
      .once()
      .withArgs({id:mocks.mapMocks.incompleteMap.id})
      .yields(mocks.mapMocks.incompleteMap);

    MapServiceMock.expects('getCachesForMap')
      .never();

    scope = $rootScope.$new();
    ctrl = $controller('MapController', {$scope: scope, $routeParams: {
      mapId: mocks.mapMocks.incompleteMap.id
    }});
  }));

  it('should create the MapController', function(done) {
    should.exist(ctrl);
    done();
  });

  it('should have loaded the map', function(done) {
    scope.$apply();
    scope.map.should.be.equal(mocks.mapMocks.incompleteMap);
    scope.mapComplete.should.be.equal(false);
    MapServiceMock.verify();
    done();
  });

  it('should not have loaded the caches for the map', function(done) {
    scope.$apply();
    should.not.exist(scope.caches);
    MapServiceMock.verify();
    done();
  });

});
