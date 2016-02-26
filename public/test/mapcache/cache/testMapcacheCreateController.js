var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , turf = require('turf')
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
    scope.$apply();
  }));

  it('should create the MapcacheCreateController', function() {
    should.exist(ctrl);
    ctrl.mapId.should.be.equal(mocks.mapMocks.xyzMap.id);
    ctrl.cache.source.should.be.equal(mocks.mapMocks.xyzMap);
    ctrl.loadingMaps.should.be.equal(false);
    ServerService.verify();
    MapService.verify();
  });

  it('should update useCurrentView', function() {
    var currentViewTime = ctrl.cache.useCurrentView;
    ctrl.useCurrentView();
    ctrl.cache.useCurrentView.should.not.be.equal(currentViewTime);
  });

  it('should set the bounding box', function() {
    ctrl.dmsChange('west', {degrees:-180, minutes: 0, seconds: 0});
    ctrl.dmsChange('south', {degrees:-85, minutes: 0, seconds: 0});
    ctrl.dmsChange('east', {degrees:180, minutes: 0, seconds: 0});
    ctrl.dmsChange('north', {degrees:85, minutes: 0, seconds: 0});
    ctrl.boundsSet.should.be.equal(true);
  });

  it('should toggle the datasource', function() {
    ctrl.cache.currentDatasources.length.should.be.equal(mocks.mapMocks.xyzMap.dataSources.length);
    ctrl.selectedDatasources[mocks.mapMocks.xyzMap.dataSources[0].id] = false;
    ctrl.toggleDataSource(mocks.mapMocks.xyzMap.dataSources[0].id, mocks.mapMocks.xyzMap.dataSources[0]);
    ctrl.cache.currentDatasources.length.should.be.equal(mocks.mapMocks.xyzMap.dataSources.length-1);
    ctrl.selectedDatasources[mocks.mapMocks.xyzMap.dataSources[0].id] = true;
    ctrl.toggleDataSource(mocks.mapMocks.xyzMap.dataSources[0].id, mocks.mapMocks.xyzMap.dataSources[0]);
    ctrl.cache.currentDatasources.length.should.be.equal(mocks.mapMocks.xyzMap.dataSources.length);
  });

  it('should check required fields', function() {
    var fieldsSet = ctrl.requiredFieldsSet();
    ctrl.unsetFields.should.include('cache name');
    ctrl.unsetFields.should.include('type of cache to create');
    ctrl.unsetFields.should.include('cache boundaries');
    ctrl.unsetFields.should.include('at least one data source');
    fieldsSet.should.be.equal(false);
  });

  it('should check required for tile cache', function() {
    ctrl.tileCacheRequested = true;
    var fieldsSet = ctrl.requiredFieldsSet();
    ctrl.unsetFields.should.include('cache name');
    ctrl.unsetFields.should.include('type of cache to create');
    ctrl.unsetFields.should.include('cache boundaries');
    ctrl.unsetFields.should.include('zoom levels');
    ctrl.unsetFields.should.include('at least one data source');
    fieldsSet.should.be.equal(false);
  });

  it('should create a cache', function() {
    CacheService.expects('createCache').yields(mocks.cacheMocks.xyzCache).once();
    var locationSpy = sandbox.spy($location, 'path');
    ctrl.cache.create = {
      'xyz': true,
      'geojson': false
    };
    ctrl.createCache();
    for (var i = 0; i < mocks.mapMocks.xyzMap.dataSources.length; i++) {
      ctrl.cache.cacheCreationParams.dataSources.should.include(mocks.mapMocks.xyzMap.dataSources[i].id);
    }

    ctrl.cache.create.should.include('xyz');
    ctrl.cache.create.should.not.include('geojson');
    ctrl.creatingCache.should.be.equal(false);
    locationSpy.calledOnce.should.be.equal(true);
    locationSpy.alwaysCalledWithExactly('/cache/'+mocks.cacheMocks.xyzCache.id).should.be.equal(true);

    CacheService.verify();
  });

  it('should redirect to /map', function() {
    var locationSpy = sandbox.spy($location, 'path');
    ctrl.createMap();
    locationSpy.calledOnce.should.be.equal(true);
    locationSpy.alwaysCalledWithExactly('/map').should.be.equal(true);
  });

  it('should calculate cache size', function() {
    ctrl.cache.minZoom = 0;
    ctrl.cache.maxZoom = 1;
    ctrl.tileCacheRequested = true;
    ctrl.cache.geometry = turf.bboxPolygon([-180, -85, 180, 85]);
    scope.$apply();
    ctrl.totalCacheSize.should.be.equal(5*(mocks.mapMocks.xyzMap.tileSize/mocks.mapMocks.xyzMap.tileSizeCount));
    ctrl.totalCacheTiles.should.be.equal(5);
  });

  it('should check if a tile cache is requested', function() {
    ctrl.cache.create = {
      'xyz': true,
      'geojson': true
    };
    scope.$apply();
    ctrl.tileCacheRequested.should.be.equal(true);
  });

});
