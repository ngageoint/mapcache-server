var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , $ = require('jquery')
  , L = require('leaflet')
  , mocks = require('../../mocks');

require('angular-mocks');

describe('LeafletCreateController tests', function() {

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
    scope.options = {
      baseLayerUrl: 'http://example.com',
      source: JSON.parse(JSON.stringify(mocks.mapMocks.xyzMap))
    };
    element = $('<div style="height: 500px;"></div>');

    ctrl = $controller('LeafletCreateController', {$scope: scope, $element: element});
    scope.$apply();
  }));

  it('should create the LeafletCreateController', function() {
    should.exist(ctrl);
  });

  it('should redraw the extent', function() {
    var featureGroupRemoveLayerSpy = sandbox.spy(L.FeatureGroup.prototype, 'removeLayer');
    var featureGroupAddLayerSpy = sandbox.spy(L.FeatureGroup.prototype, 'addLayer');
    scope.$emit('extentChanged', {west: 10, east: 20, north: 10, south: 0});
    scope.$apply();
    featureGroupAddLayerSpy.calledOnce.should.be.equal(true);
    featureGroupRemoveLayerSpy.calledOnce.should.be.equal(true);
  });

  it('should fit the bounds of the extent', function() {
    var mapFitBoundsSpy = sandbox.spy(L.Map.prototype, 'fitBounds');
    scope.options.extent = [10, 0, 20, 10];
    scope.$apply();
    mapFitBoundsSpy.calledOnce.should.be.equal(true);
  });

  it('should use the currentView', function() {
    var featureGroupRemoveLayerSpy = sandbox.spy(L.FeatureGroup.prototype, 'removeLayer');
    var featureGroupAddLayerSpy = sandbox.spy(L.FeatureGroup.prototype, 'addLayer');
    scope.options.useCurrentView = new Date();
    scope.$apply();
    featureGroupAddLayerSpy.calledOnce.should.be.equal(true);
    featureGroupRemoveLayerSpy.calledOnce.should.be.equal(true);
  });

});
