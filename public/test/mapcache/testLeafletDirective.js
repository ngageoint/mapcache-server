var angular = require('angular')
  , angularMocks = require('angular-mocks');

describe('leaflet directive tests', function() {

  var $compile,
      $rootScope;

  before(function() {
    require('../../app/mapcache/map');
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_$compile_, _$rootScope_){
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  it('Replaces the element with the appropriate content', function() {
    var scope = $rootScope.$new();
    var element = $compile('<div leaflet></div>')(scope);
    scope.$apply();
    element.html().should.not.be.equal('<div leaflet></div>');
  });

  it('should have returned a directive', function() {
    var leafletDirective = require('../../app/mapcache/leaflet.directive')();
    leafletDirective.controller.should.be.equal('LeafletController');
    leafletDirective.template.should.be.equal('<div class="leaflet-map"></div>');
  });

});
