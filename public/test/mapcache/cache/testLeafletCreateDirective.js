var angular = require('angular')
  , mocks = require('../../mocks')
  , angularMocks = require('angular-mocks');

describe('leaflet create directive tests', function() {

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
    scope.options = {
      currentDatasources: {},
      source: mocks.mapMocks.xyzMap
    };
    var element = $compile('<div leaflet-create options="options"></div>')(scope);
    scope.$apply();
    element.html().should.not.be.equal('<div leaflet-create options="options"></div>');
  });

  it('should have returned a directive', function() {
    var leafletDirective = require('../../../app/mapcache/cache/leaflet.create.directive')();
    leafletDirective.controller.should.be.equal('LeafletCreateController');
    leafletDirective.template.should.be.equal('<div style="height: 500px;"></div>');
    leafletDirective.scope.should.be.deep.equal({
      options: '='
    });
  });

});
