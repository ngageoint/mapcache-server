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
    var vectorSource;
    for (var i = 0; i < scope.map.dataSources.length && !vectorSource; i++) {
      if (scope.map.dataSources[i].vector) {
        vectorSource = scope.map.dataSources[i];
      }
    }
    scope.setStyleTab(vectorSource.id);
    scope.$apply();
    scope.tab.should.be.equal(vectorSource.id);
    scope.styleTab.should.be.equal(vectorSource);
  });

  it('should add the new style rule', function() {
    var vectorSource;
    for (var i = 0; i < scope.map.dataSources.length && !vectorSource; i++) {
      if (scope.map.dataSources[i].vector) {
        vectorSource = scope.map.dataSources[i];
      }
    }
    scope.setStyleTab(vectorSource.id);
    var newRule = {
      property: {
        key: 'key',
        value: 'value'
      }
    };
    scope.newRule = JSON.parse(JSON.stringify(newRule));

    scope.applyStyle();

    newRule.property.priority = 0;
    scope.styleTab.style.styles.should.include(newRule.property);

    scope.newRule.should.be.deep.equal({});

  });

  it('should delete the style', function(done) {
    var vectorSource;
    for (var i = 0; i < scope.map.dataSources.length && !vectorSource; i++) {
      if (scope.map.dataSources[i].vector) {
        vectorSource = scope.map.dataSources[i];
      }
    }
    scope.setStyleTab(vectorSource.id);
    var newRule = {
      property: {
        key: 'key',
        value: 'value'
      }
    };
    scope.newRule = JSON.parse(JSON.stringify(newRule));
    scope.applyStyle();
    scope.styleTab.style.styles.length.should.be.equal(1);
    scope.$emit('deleteStyle', scope.styleTab.style.styles[0]);
    scope.$apply();
    scope.styleTab.style.styles.length.should.be.equal(0);
    done();
  });

  it('should promote the style', function(done) {
    var vectorSource;
    for (var i = 0; i < scope.map.dataSources.length && !vectorSource; i++) {
      if (scope.map.dataSources[i].vector) {
        vectorSource = scope.map.dataSources[i];
      }
    }
    scope.setStyleTab(vectorSource.id);
    scope.newRule = {
      property: {
        key: 'key',
        value: 'value'
      }
    };
    var newRule2 = {
      property: {
        key: 'key2',
        value: 'value2'
      }
    };
    scope.applyStyle();
    scope.newRule = newRule2;
    scope.applyStyle();
    scope.styleTab.style.styles.length.should.be.equal(2);
    scope.styleTab.style.styles[1].priority.should.be.equal(1);
    scope.styleTab.style.styles[0].priority.should.be.equal(0);
    scope.$emit('promoteStyle', scope.styleTab.style.styles[1]);
    scope.$apply();
    scope.styleTab.style.styles[1].key.should.be.equal('key2');
    scope.styleTab.style.styles[1].priority.should.be.equal(0);
    scope.styleTab.style.styles[0].priority.should.be.equal(1);
    done();
  });

  it('should demote the style', function(done) {
    var vectorSource;
    for (var i = 0; i < scope.map.dataSources.length && !vectorSource; i++) {
      if (scope.map.dataSources[i].vector) {
        vectorSource = scope.map.dataSources[i];
      }
    }
    scope.setStyleTab(vectorSource.id);
    scope.newRule = {
      property: {
        key: 'key',
        value: 'value'
      }
    };
    var newRule2 = {
      property: {
        key: 'key2',
        value: 'value2'
      }
    };
    scope.applyStyle();
    scope.newRule = newRule2;
    scope.applyStyle();
    scope.styleTab.style.styles.length.should.be.equal(2);
    scope.styleTab.style.styles[0].priority.should.be.equal(0);
    scope.styleTab.style.styles[1].priority.should.be.equal(1);
    scope.$emit('demoteStyle', scope.styleTab.style.styles[0]);
    scope.$apply();
    scope.styleTab.style.styles[0].key.should.be.equal('key');
    scope.styleTab.style.styles[0].priority.should.be.equal(1);
    scope.styleTab.style.styles[1].priority.should.be.equal(0);
    done();
  });

  it('should save the map', function(done){
    MapServiceMock.expects('saveMap')
      .withArgs(mocks.mapMocks.xyzMap)
      .once()
      .yields(JSON.parse(JSON.stringify(mocks.mapMocks.xyzMap)));

    scope.saveMap();
    MapServiceMock.verify();
    done();
  });


});
