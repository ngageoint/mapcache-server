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

  it('should discover an xyz url', function(done) {
    var url = 'http://osm.geointapps.org/osm';

    MapServiceMock.expects('discoverMap').withArgs(url).yields(mocks.mapDiscoveryMocks.xyzMapDiscovery);
    underscoreExpectation.once();
    scope.mapDatasource = {};
    scope.$emit('location-url', url);
    scope.urlDiscovery.should.be.equal(false);
    scope.mapDatasource.format.should.be.equal('xyz');
    scope.mapDatasource.url.should.be.equal(url);
    scope.mapDatasource.valid.should.be.equal(true);
    scope.locationStatus.should.be.equal('success');
    UnderscoreMock.verify();
    MapServiceMock.verify();
    done();
  });

  it('should discover a valid url but return no format', function(done) {
    var url = 'http://osm.geointapps.org/osm';

    MapServiceMock.expects('discoverMap').withArgs(url).yields(mocks.mapDiscoveryMocks.validNoFormatMapDiscovery);
    underscoreExpectation.once();
    scope.mapDatasource = {};
    scope.$emit('location-url', url);
    scope.urlDiscovery.should.be.equal(false);
    scope.mapDatasource.valid.should.be.equal(true);
    scope.mapDatasource.url.should.be.equal(url);
    scope.locationStatus.should.be.equal('warning');
    UnderscoreMock.verify();
    MapServiceMock.verify();
    done();
  });

  it('should discover an invalid url', function(done) {
    var url = 'http://osm.geointapps.org/osm';

    MapServiceMock.expects('discoverMap').withArgs(url).yields(mocks.mapDiscoveryMocks.invalidXyzMapDiscovery);
    underscoreExpectation.once();
    scope.mapDatasource = {};
    scope.$emit('location-url', url);
    scope.urlDiscovery.should.be.equal(false);
    scope.mapDatasource.valid.should.be.equal(false);
    scope.mapDatasource.url.should.be.equal(url);
    scope.locationStatus.should.be.equal('error');
    UnderscoreMock.verify();
    MapServiceMock.verify();
    done();
  });

  it('should discover an invalid url', function(done) {
    var url = 'http://osm.geointapps.org/osm';

    MapServiceMock.expects('discoverMap').withArgs(url).yields(mocks.mapDiscoveryMocks.invalidXyzMapDiscovery);
    underscoreExpectation.once();
    scope.mapDatasource = {};
    scope.$emit('location-url', url);
    scope.urlDiscovery.should.be.equal(false);
    scope.mapDatasource.valid.should.be.equal(false);
    scope.mapDatasource.url.should.be.equal(url);
    scope.locationStatus.should.be.equal('error');
    UnderscoreMock.verify();
    MapServiceMock.verify();
    done();
  });

  it('should fail to discover the url', function(done) {
    var url = 'http://osm.geointapps.org/osm';

    MapServiceMock.expects('discoverMap').withArgs(url).callsArg(2);
    underscoreExpectation.once();
    scope.mapDatasource = {};
    scope.$emit('location-url', url);
    scope.urlDiscovery.should.be.equal(false);
    scope.mapDatasource.valid.should.be.equal(false);
    should.not.exist(scope.locationStatus);
    UnderscoreMock.verify();
    MapServiceMock.verify();
    done();
  });

  it('should show the map if there is an xyz url', function() {
    scope.mapDatasource = {
      format: 'xyz'
    };
    scope.$apply();
    scope.showMap.should.be.equal(true);
  });

  it('should show the map if there is a tms url', function() {
    scope.mapDatasource = {
      format: 'tms'
    };
    scope.$apply();
    scope.showMap.should.be.equal(true);
  });

  it('should show the map if there is an wms url and wmsGetCapabilities', function() {
    scope.mapDatasource = {
      format: 'wms',
      metadata: {
        wmsGetCapabilities: mocks.wmsGetCapabilitiesMocks.wmsGetCapabilities
      }
    };
    scope.$apply();
    scope.showMap.should.be.equal(true);
  });

  it('should get the wmsGetCapabilities and then show the map if there is an wms url', function() {
    var url = 'http://watzmann.geog.uni-heidelberg.de/cached/osm';
    MapServiceMock.expects('getWmsGetCapabilities')
      .withArgs(url)
      .once()
      .yields(mocks.wmsGetCapabilitiesMocks.wmsGetCapabilities);
    scope.mapDatasource = {
      url: url,
      format: 'wms',
      metadata: {}
    };
    scope.$apply();
    scope.showMap.should.be.equal(true);
    MapServiceMock.verify();
    scope.mapDatasource.metadata.wmsGetCapabilities.should.be.deep.equal(mocks.wmsGetCapabilitiesMocks.wmsGetCapabilities);
  });

  // TODO get an ArcGIS url to test with
  // it('should show the map if there is an arcgis url', function() {
  //   scope.mapDatasource = {
  //     format: 'arcgis'
  //   };
  //   scope.$apply();
  //   scope.showMap.should.be.equal(true);
  // });

});
