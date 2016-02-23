var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , $ = require('jquery')
  , mocks = require('../../mocks');

require('angular-mocks');

describe('LeafletCacheController tests', function() {

  var scope
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

  beforeEach(inject(function(_$rootScope_, $controller){
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    scope.cache = JSON.parse(JSON.stringify(mocks.cacheMocks.xyzCache));
    scope.options = {
      baseLayerUrl: 'http://example.com'
    };
    element = $('<div class="leaflet-map"></div>');

    ctrl = $controller('LeafletCacheController', {$scope: scope, $element: element});
    scope.$apply();
  }));

  it('should create the LeafletCacheController', function() {
    should.exist(ctrl);
  });

});
