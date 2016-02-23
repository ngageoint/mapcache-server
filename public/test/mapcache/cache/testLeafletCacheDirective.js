var angular = require('angular')
  , angularMocks = require('angular-mocks');

describe('leaflet cache directive tests', function() {

  var $compile,
      $rootScope;

  before(function() {
    require('../../../app/mapcache/map');
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_$compile_, _$rootScope_){
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  it('Replaces the element with the appropriate content', function() {
    var scope = $rootScope.$new();
    var element = $compile('<div leaflet-cache></div>')(scope);
    scope.$apply();
    element.html().should.not.be.equal('<div leaflet-cache></div>');
  });

  it('should have returned a directive', function() {
    var leafletDirective = require('../../../app/mapcache/cache/leaflet.cache.directive')();
    leafletDirective.controller.should.be.equal('LeafletCacheController');
    leafletDirective.template.should.be.equal('<div class="leaflet-map"></div>');
    leafletDirective.scope.should.be.deep.equal({
      cache: '=',
      options: '='
    });
  });

});
