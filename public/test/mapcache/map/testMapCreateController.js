var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , mocks = require('../../mocks');

require('angular-mocks');

describe('MapCreateController tests', function() {

  var scope;
  var ctrl;

  var MapService;
  var MapServiceMock;

  var sandbox;
  var $location;

  before(function() {
    angular.mock.module('mapcache', [  ]);
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

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(function() {
    angular.mock.module(function($provide) {
      $provide.value('MapService', MapService);
    });
  });

  beforeEach(inject(function($rootScope, $controller, $injector){
    $location = $injector.get('$location');
    scope = $rootScope.$new();
    ctrl = $controller('MapCreateController', {$scope: scope});
  }));

  it('should create the MapCreateController', function(done) {
    should.exist(ctrl);
    done();
  });

  it('should add a datasource', function(done) {
    var oldLength = scope.map.dataSources.length;
    scope.addDataSource();
    scope.$apply();
    scope.dataSourcesValidated.should.be.equal(false);
    scope.map.dataSources.length.should.be.equal(oldLength+1);
    done();
  });

  it('should add a valid datasource', function(done) {
    scope.map.dataSources[0].url = 'http://osm.geointapps.org/osm';
    scope.map.dataSources[0].valid = true;
    scope.map.dataSources[0].format = 'xyz';
    scope.$apply();

    scope.dataSourcesValidated.should.be.equal(true);
    scope.map.dataSources.length.should.be.equal(1);
    scope.dataSourceTotalFileSize.should.be.equal(0);
    done();
  });

  it('should add a valid file datasource', function(done) {
    scope.map.dataSources[0].file = {
      name: 'test.tiff',
      size: 10
    };
    scope.map.dataSources[0].valid = true;
    scope.map.dataSources[0].format = 'xyz';
    scope.$apply();

    scope.dataSourcesValidated.should.be.equal(true);
    scope.map.dataSources.length.should.be.equal(1);
    scope.dataSourceTotalFileSize.should.be.equal(10);
    done();
  });

  it('should create a map', function(done) {
    var spy = sandbox.spy($location, 'path');
    var createMapSpy = sandbox.stub(MapService, "createMap", function(map, success, failure, progress){
      progress({
        lengthComputable: 100,
        loaded: 10,
        total: 10
      });
      success(mocks.mapMocks.xyzMap);
    });
    scope.createMap();
    scope.$apply();
    scope.mapSubmitted.should.be.equal(true);
    spy.calledOnce.should.be.equal(true);
    spy.alwaysCalledWithExactly('/map/'+mocks.mapMocks.xyzMap.id).should.be.equal(true);
    createMapSpy.calledOnce.should.be.equal(true);
    done();
  });

});
