var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , mocks = require('../../mocks');

require('angular-mocks');

describe('MapEditController tests', function() {

  var scope;
  var ctrl;

  var MapService;
  var MapServiceMock;

  var sandbox;
  var $location;

  before(function() {
    require('../../../app/mapcache/map');
  });

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
    MapServiceMock.expects('refreshMap')
      .once()
      .yields(JSON.parse(JSON.stringify(mocks.mapMocks.xyzMap)));
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(function() {
    angular.mock.module(function($provide) {
      $provide.value('MapService', MapService);
    });
  });

  beforeEach(inject(function($rootScope, $controller, $injector){
    $location = $injector.get('$location');
    scope = $rootScope.$new();
    ctrl = $controller('MapEditController', {$scope: scope, $routeParams: {
      mapId: mocks.mapMocks.xyzMap.id
    }});
  }));

  it('should create the MapEditController', function() {
    should.exist(ctrl);
    MapServiceMock.verify();
    scope.$apply();
    scope.map.should.be.deep.equal(mocks.mapMocks.xyzMap);
  });

  it('should set unsaved changes to true', function() {
    should.exist(ctrl);
    MapServiceMock.verify();
    scope.$apply();
    scope.map.should.be.deep.equal(mocks.mapMocks.xyzMap);
    scope.map.name = 'new name';
    scope.$apply();
    scope.unsavedChanges.should.be.equal(true);
  });

  it('should delete a data source', function() {
    var deletedDataSourceMap = JSON.parse(JSON.stringify(mocks.mapMocks.xyzMap));
    deletedDataSourceMap.dataSources = deletedDataSourceMap.dataSources.slice(1);
    MapServiceMock.expects('deleteDataSource')
      .once()
      .withArgs(scope.map, scope.map.dataSources[0].id)
      .yields(deletedDataSourceMap);

    var dataSourceCount = scope.map.dataSources.length;

    scope.deleteDataSource(scope.map.dataSources[0].id);
    scope.$apply();
    MapServiceMock.verify();
    scope.map.dataSources.length.should.be.equal(dataSourceCount-1);
  });

  it('should set the style tab', function() {
    scope.setStyleTab(scope.map.dataSources[0].id);
    scope.$apply();
    scope.tab.should.be.equal(scope.map.dataSources[0].id);
    scope.styleTab.should.be.equal(scope.map.dataSources[0]);
  });

});
