var angular = require('angular')
  , angularMocks = require('angular-mocks');

describe('leaflet map directive tests', function() {

  var $compile,
      $rootScope;

  before(function() {
    angular.mock.module('mapcache', [  ]);
    require('../../../app/mapcache/map');
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_$compile_, _$rootScope_){
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  it('Replaces the element with the appropriate content', function() {
    var scope = $rootScope.$new();
    var element = $compile('<div leaflet-map map="map" caches="caches" options="options"></div>')(scope);
    scope.$apply();
    element.html().should.not.be.equal('<div leaflet-map map="map" caches="caches" options="options"></div>');
  });

  it('should have returned a directive', function() {
    var leafletMapDirective = require('../../../app/mapcache/map/leaflet.map.directive')();
    leafletMapDirective.controller.should.be.equal('LeafletMapController');
    leafletMapDirective.template.should.be.equal('<div class="leaflet-map"></div>');
    leafletMapDirective.scope.should.deep.equal({
      map: '=',
      options: '=',
      caches: '=',
      dataSources: '='
    });
  });

});
