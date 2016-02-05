var angular = require('angular')
  , mocks = require('../../mocks')
  , angularMocks = require('angular-mocks');

require('../../../vendor/angular-ui-select');

describe('map datasource directive tests', function() {

  var $compile,
      $rootScope;

  before(function() {
    angular.mock.module('mapcache', [ 'ui.select']);
    require('../../../app/mapcache/map');
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(angular.mock.module('app/mapcache/map/map-datasource.html'));

  beforeEach(inject(function(_$compile_, _$rootScope_){
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  // it('Replaces the element with the appropriate content', function() {
  //   var scope = $rootScope.$new();
  //   scope.dataSource = mocks.mapMocks.maps[0].dataSources[0];
  //   var element = $compile('<div map-datasource="dataSource"></div>')(scope);
  //   scope.$apply();
  //   console.log('element', element.html());
  //   element.html().should.not.be.equal('<div map-datasource="dataSource"></div>');
  // });

  it('should have returned a directive', function() {
    var mapDatasourceDirective = require('../../../app/mapcache/map/map.datasource.directive')();
    mapDatasourceDirective.controller.should.be.equal('MapDatasourceController');
    mapDatasourceDirective.templateUrl.should.be.equal('app/mapcache/map/map-datasource.html');
    mapDatasourceDirective.scope.should.deep.equal({
      mapDatasource: '='
    });
  });

});
