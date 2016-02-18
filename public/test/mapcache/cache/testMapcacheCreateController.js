var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , mocks = require('../../mocks');

require('angular-mocks');

describe('MapcacheCreateController tests', function() {

  var CacheService
    , MapService
    , ServerService
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

  beforeEach(inject(function(_CacheService_, _MapService_, _ServerService_, $injector){
    $location = $injector.get('$location');
    CacheService = sandbox.mock(_CacheService_);
    MapService = sandbox.mock(_MapService_);
    ServerService = sandbox.mock(_ServerService_);
  }));

  beforeEach(function() {
    ServerService.expects('getMaxCacheSize').yields(mocks.serverMocks.maxCacheSize).once();
  });

  beforeEach(function() {
    MapService.expects('getMap').yields(mocks.mapMocks.xyzMap).once();
  });

  beforeEach(inject(function($rootScope, $controller){
    scope = $rootScope.$new();
    ctrl = $controller('MapcacheCreateController', {$scope: scope, $routeParams: {
      mapId: mocks.mapMocks.xyzMap.id
    }});
  }));

  it('should create the MapcacheCreateController', function() {
    should.exist(ctrl);
    ctrl.mapId.should.be.equal(mocks.mapMocks.xyzMap.id);
    ctrl.cache.source.should.be.equal(mocks.mapMocks.xyzMap);
    ctrl.loadingMaps.should.be.equal(false);
    ServerService.verify();
    MapService.verify();
  });

});
