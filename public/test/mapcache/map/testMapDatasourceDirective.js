var angular = require('angular')
  , $ = require('jquery')
  , mocks = require('../../mocks')
  , sinon  = require('sinon')
  , _ = require('underscore')
  , angularMocks = require('angular-mocks');

require('../../../vendor/angular-ui-select');

describe('map datasource directive tests', function() {

  var $compile,
      $scope,
      $rootScope,
      MapService,
      MapServiceMock,
      UnderscoreMock,
      underscoreExpectation,
      sandbox;

  before(function() {
    require('../../../app/mapcache/map');
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  beforeEach(function() {
    MapService = require('../../../app/factories/map.service')();
    MapServiceMock = sandbox.mock(MapService);
  });

  beforeEach(function() {
    angular.mock.module(function($provide) {
      $provide.value('MapService', MapService);
      // $provide.value('MapDatasourceController', MapDatasourceController);
    });
  });

  beforeEach(function() {
    UnderscoreMock = sandbox.mock(_);
    underscoreExpectation = UnderscoreMock.expects('debounce');
    underscoreExpectation.onFirstCall().returnsArg(0).onSecondCall().callsArg(0);
  });

  beforeEach(inject(function(_$compile_, _$rootScope_){
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $scope = _$rootScope_.$new();
  }));

  it('Replaces the element with the appropriate content', function() {
    $scope.dataSource = mocks.mapMocks.maps[0].dataSources[0];
    var element = $compile('<div map-datasource="dataSource"></div>')($scope);
    $scope.$apply();
    element.html().should.not.be.equal('<div map-datasource="dataSource"></div>');
  });

  it('should have returned a directive', function() {
    var mapDatasourceDirective = require('../../../app/mapcache/map/map.datasource.directive')();
    mapDatasourceDirective.controller.should.be.equal('MapDatasourceController');
    mapDatasourceDirective.templateUrl.should.be.equal('app/mapcache/map/map-datasource.html');
    mapDatasourceDirective.scope.should.deep.equal({
      mapDatasource: '='
    });
  });

  it('should set up a wms data source', function() {
    var url = 'http://watzmann.geog.uni-heidelberg.de/cached/osm';
    MapServiceMock.expects('getWmsGetCapabilities')
      .withArgs(url)
      .once()
      .yields(mocks.wmsGetCapabilitiesMocks.wmsGetCapabilities);

    $scope.dataSource = {
    };
    var element = $compile('<div map-datasource="dataSource"></div>')($scope);
    var escope = element.scope();
    $scope.$apply();

    escope.dataSource.url = url;
    escope.dataSource.format = 'wms';
    $scope.$apply();
    $scope.dataSource.metadata.wmsGetCapabilities.should.be.deep.equal(mocks.wmsGetCapabilitiesMocks.wmsGetCapabilities);

    var selectContainer = $(element).find('.ui-select-container')[0];
    var toggle = $(selectContainer).find('.ui-select-toggle')[0];
    toggle.click();
    $scope.$apply();
    var choiceRow = $(selectContainer).find('.ui-select-choices-row')[0];
    choiceRow.click();
    $scope.$apply();

    $scope.dataSource.metadata.wmsLayer.should.be.deep.equal(mocks.wmsGetCapabilitiesMocks.wmsGetCapabilities.Capability.Layer.Layer[1]);

    MapServiceMock.verify();

  });

});
