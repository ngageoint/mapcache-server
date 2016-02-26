var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , $ = require('jquery')
  , L = require('leaflet')
  , mocks = require('../mocks');

require('angular-mocks');

describe('LeafletController tests', function() {

  var MapService
    , LeafletUtilities
    , scope
    , ctrl
    , element
    , $rootScope;

  var sandbox;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_MapService_, _LeafletUtilities_){
    MapService = sandbox.mock(_MapService_);
    LeafletUtilities = sandbox.mock(_LeafletUtilities_);
  }));

  beforeEach(inject(function(_$rootScope_, $controller){
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    scope.map = JSON.parse(JSON.stringify(mocks.mapMocks.xyzMap));
    scope.options = {
      baseLayerUrl: 'http://example.com'
    };
    element = $('<div class="leaflet-map"></div>');

    ctrl = $controller('LeafletController', {$scope: scope, $element: element});
    scope.$apply();
  }));

  it('should create the LeafletController', function() {
    should.exist(ctrl);
  });

  it('should set the caches', function() {
    var styleMock = sandbox.mock(L.GeoJSON.prototype).expects('setStyle').withArgs({fill: false, color: undefined, opacity: 0, weight: 4}).once();
    scope.caches = [mocks.cacheMocks.xyzCache];
    scope.$apply();
    styleMock.verify();
  });

  it('should show a cache', function() {
    var addToSpy = sinon.spy();
    var mock = sandbox.mock(L).expects('tileLayer').withArgs('/api/caches/'+mocks.cacheMocks.xyzCache.id+'/{z}/{x}/{y}.png?access_token=null').once().returns({addTo: addToSpy});

    $rootScope.$emit('showCache', mocks.cacheMocks.xyzCache);
    scope.$apply();
    mock.verify();
    addToSpy.calledOnce.should.be.equal(true);
  });

  it('should hide a cache', function() {
    $rootScope.$emit('showCache', mocks.cacheMocks.xyzCache);
    scope.$apply();
    var mock = sandbox.mock(L.Map.prototype).expects('removeLayer').once();
    $rootScope.$emit('hideCache', mocks.cacheMocks.xyzCache);
    scope.$apply();
    mock.verify();
  });

  it('should show the cache extent', function() {
    var mock = sandbox.mock(L.FeatureGroup.prototype).expects('addTo').once();
    var styleMock = sandbox.mock(L.GeoJSON.prototype).expects('setStyle').withArgs({fill: false, color: '#0066A2', opacity: 1, weight: 4}).once();
    $rootScope.$emit('showCacheExtent', mocks.cacheMocks.xyzCache);
    scope.$apply();

    mock.verify();
    styleMock.verify();
  });

  it('should hide the cache extent', function() {
    var mock = sandbox.mock(L.GeoJSON.prototype).expects('setStyle').withArgs({fill: false, color: undefined, opacity: 0, weight: 4}).once();

    $rootScope.$emit('hideCacheExtent', mocks.cacheMocks.xyzCache);
    scope.$apply();

    mock.verify();
  });

  it('should show the cache tiles', function(){
    var addToSpy = sinon.spy();
    var mock = sandbox.mock(L).expects('tileLayer').withArgs('/api/caches/'+mocks.cacheMocks.xyzCache.id+'/{z}/{x}/{y}.png?access_token=null').once().returns({addTo: addToSpy});

    $rootScope.$emit('showCacheTiles', mocks.cacheMocks.xyzCache);
    scope.$apply();
    mock.verify();
    addToSpy.calledOnce.should.be.equal(true);
  });

  it('should hide a cache', function() {
    $rootScope.$emit('showCache', mocks.cacheMocks.xyzCache);
    scope.$apply();
    var mock = sandbox.mock(L.Map.prototype).expects('removeLayer').once();
    $rootScope.$emit('hideCacheTiles', mocks.cacheMocks.xyzCache);
    scope.$apply();
    mock.verify();
  });

  it('should overlay the source tiles', function() {
    var addToSpy = sinon.spy();
    var mock = sandbox.mock(L).expects('tileLayer').once().returns({addTo: addToSpy});
    sandbox.stub(L.Map.prototype, 'getCenter').returns({});
    sandbox.stub(L.Map.prototype, 'getZoom').returns(4);

    $rootScope.$emit('overlaySourceTiles', mocks.mapMocks.xyzMap);

    scope.$apply();
    mock.verify();
    addToSpy.calledOnce.should.be.equal(true);
  });

  it('should remove the source tiles', function() {
    var addToSpy = sinon.spy();
    var mock = sandbox.mock(L).expects('tileLayer').once().returns({addTo: addToSpy});
    sandbox.stub(L.Map.prototype, 'setView').returns(4);

    $rootScope.$emit('overlaySourceTiles', mocks.mapMocks.xyzMap);

    scope.$apply();
    var mapMock = sandbox.mock(L.Map.prototype).expects('removeLayer').once();

    $rootScope.$emit('removeSourceTiles', mocks.mapMocks.xyzMap);
    scope.$apply();

    mock.verify();
    mapMock.verify();
    addToSpy.calledOnce.should.be.equal(true);
  });

});
