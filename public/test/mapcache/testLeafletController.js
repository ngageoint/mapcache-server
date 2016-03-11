var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , $ = require('jquery')
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

});
