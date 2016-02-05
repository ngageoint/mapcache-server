var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , mocks = require('../../mocks')
  , _ = require('underscore');

require('angular-mocks');

describe('MapDatasourceController tests', function() {

  var scope;
  var ctrl;

  var MapService;
  var MapServiceMock;

  var UnderscoreMock;
  var underscoreExpectation;

  var sandbox;

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

  beforeEach(function() {
    UnderscoreMock = sandbox.mock(_);
    underscoreExpectation = UnderscoreMock.expects('debounce');
    underscoreExpectation.onFirstCall().returnsArg(0).onSecondCall().callsArg(0);
  });

  beforeEach(inject(function($rootScope, $controller){
    scope = $rootScope.$new();
    ctrl = $controller('MapDatasourceController', {$scope: scope});
  }));

  it('should create the MapDatasourceController', function(done) {
    should.exist(ctrl);
    done();
  });

  it('should add a geojson file', function() {
    scope.mapDatasource = {};
    var file = {
      name: 'test.geojson'
    };
    scope.$emit('location-file', file);
    scope.mapDatasource.format.should.be.equal('geojson');
    scope.format.should.be.equal('geojson');
    scope.mapDatasource.file.should.be.deep.equal(file);
  });

  it('should add a json file', function() {
    scope.mapDatasource = {};
    var file = {
      name: 'test.json'
    };
    scope.$emit('location-file', file);
    scope.mapDatasource.format.should.be.equal('geojson');
    scope.format.should.be.equal('geojson');
    scope.mapDatasource.file.should.be.deep.equal(file);
  });


  it('should add a tif file', function() {
    scope.mapDatasource = {};
    var file = {
      name: 'test.tif'
    };
    scope.$emit('location-file', file);
    scope.mapDatasource.format.should.be.equal('geotiff');
    scope.format.should.be.equal('geotiff');
    scope.mapDatasource.file.should.be.deep.equal(file);
  });

  it('should add a tiff file', function() {
    scope.mapDatasource = {};
    var file = {
      name: 'test.tiff'
    };
    scope.$emit('location-file', file);
    scope.mapDatasource.format.should.be.equal('geotiff');
    scope.format.should.be.equal('geotiff');
    scope.mapDatasource.file.should.be.deep.equal(file);
  });

  it('should add a geotif file', function() {
    scope.mapDatasource = {};
    var file = {
      name: 'test.geotif'
    };
    scope.$emit('location-file', file);
    scope.mapDatasource.format.should.be.equal('geotiff');
    scope.format.should.be.equal('geotiff');
    scope.mapDatasource.file.should.be.deep.equal(file);
  });

  it('should add a geotiff file', function() {
    scope.mapDatasource = {};
    var file = {
      name: 'test.geotiff'
    };
    scope.$emit('location-file', file);
    scope.mapDatasource.format.should.be.equal('geotiff');
    scope.format.should.be.equal('geotiff');
    scope.mapDatasource.file.should.be.deep.equal(file);
  });

  it('should add a sid file', function() {
    scope.mapDatasource = {};
    var file = {
      name: 'test.sid'
    };
    scope.$emit('location-file', file);
    scope.mapDatasource.format.should.be.equal('mrsid');
    scope.format.should.be.equal('mrsid');
    scope.mapDatasource.file.should.be.deep.equal(file);
  });

  it('should add a mbtiles file', function() {
    scope.mapDatasource = {};
    var file = {
      name: 'test.mbtiles'
    };
    scope.$emit('location-file', file);
    scope.mapDatasource.format.should.be.equal('mbtiles');
    scope.format.should.be.equal('mbtiles');
    scope.mapDatasource.file.should.be.deep.equal(file);
  });

  it('should add a zip file', function() {
    scope.mapDatasource = {};
    var file = {
      name: 'test.zip'
    };
    scope.$emit('location-file', file);
    scope.mapDatasource.format.should.be.equal('shapefile');
    scope.format.should.be.equal('shapefile');
    scope.mapDatasource.file.should.be.deep.equal(file);
  });

  it('should add a kmz file', function() {
    scope.mapDatasource = {};
    var file = {
      name: 'test.kmz'
    };
    scope.$emit('location-file', file);
    scope.mapDatasource.format.should.be.equal('kmz');
    scope.format.should.be.equal('kmz');
    scope.mapDatasource.file.should.be.deep.equal(file);
  });

  it('should clear the url', function(done) {
    scope.$emit('location-url');
    scope.mapDatasource.should.be.empty;  //jshint ignore:line
    done();
  });

  // continue to verify this test
  it('should add an xyz url', function(done) {
    underscoreExpectation.once();
    scope.mapDatasource = {};
    var url = 'http://osm.geointapps.org/osm';
    scope.$emit('location-url', url);
    scope.urlDiscovery.should.be.equal(true);
    scope.mapDatasource.url.should.be.equal(url);
    UnderscoreMock.verify();
    done();
  });

  // it('should have loaded the map', function(done) {
  //   getCachesExpectation.once();
  //   scope.$apply();
  //   scope.map.should.be.equal(mocks.mapMocks.xyzMap);
  //   scope.mapComplete.should.be.equal(true);
  //   MapServiceMock.verify();
  //   done();
  // });
  //
  // it('should have loaded the caches for the map', function(done) {
  //   getCachesExpectation.twice();
  //   scope.$apply();
  //   scope.caches.should.be.equal(mocks.cacheMocks.completeCaches);
  //   $timeout.flush(300000);
  //   MapServiceMock.verify();
  //   done();
  // });
  //
  // it('should generate a cache format', function(done) {
  //   CacheServiceMock.expects('createCacheFormat')
  //     .once()
  //     .withArgs(mocks.cacheMocks.xyzCache, 'xyz')
  //     .callsArg(2);
  //   getCachesExpectation.twice();
  //   scope.$emit('generateFormat', mocks.cacheMocks.xyzCache, 'xyz');
  //   scope.$apply();
  //   scope.caches.should.be.equal(mocks.cacheMocks.completeCaches);
  //   MapServiceMock.verify();
  //   done();
  // });
  //
  // it('should filter the caches', function(done) {
  //   scope.$emit('cacheFilterChange', {cacheFilter: 'XYZ'});
  //   scope.caches.length.should.be.equal(1);
  //   done();
  // });
  //
  // it('should redirect to the create page with the mapid', function(done) {
  //   var spy = sinon.spy($location, 'path');
  //   scope.createCacheFromMap();
  //   spy.alwaysCalledWithExactly('/create/'+mocks.mapMocks.xyzMap.id).should.be.equal(true);
  //   spy.calledOnce.should.be.equal(true);
  //   done();
  // });

});
