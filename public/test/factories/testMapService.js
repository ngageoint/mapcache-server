var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , $ = require('jquery')
  , _ = require('underscore')
  , mocks = require('../mocks');

require('angular-mocks');

describe('Map Service tests', function() {

  var MapService
    , $httpBackend;

  var sandbox;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_MapService_, $injector){
    MapService = _MapService_;
    $httpBackend = $injector.get('$httpBackend');
  }));

  it('should create the MapService', function() {
    should.exist(MapService);
  });

  it('should get all the maps', function(done) {
    $httpBackend.expect('GET', '/api/maps')
      .respond(mocks.mapMocks.maps);

    MapService.getAllMaps().then(function(success) {
      success.should.be.deep.equal(mocks.mapMocks.maps);
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should get the map', function(done) {
    $httpBackend.expect('GET', '/api/maps/'+mocks.mapMocks.xyzMap.id)
      .respond(mocks.mapMocks.xyzMap);

    MapService.getMap({id:mocks.mapMocks.xyzMap.id}, function(success) {
      success.should.be.deep.equal(mocks.mapMocks.xyzMap);
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should get the caches for the map', function(done) {
    $httpBackend.expect('GET', '/api/maps/'+mocks.mapMocks.xyzMap.id + '/caches')
      .respond(mocks.cacheMocks.caches);

    MapService.getCachesForMap(mocks.mapMocks.xyzMap, function(caches) {
      caches.should.be.deep.equal(mocks.cacheMocks.caches);
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should fail to get the caches for the map', function(done) {
    $httpBackend.expect('GET', '/api/maps/'+mocks.mapMocks.xyzMap.id + '/caches')
      .respond(503, 'failure');

    MapService.getCachesForMap(mocks.mapMocks.xyzMap, function() {
    }, function(failure) {
      failure.status.should.be.equal(503);
      failure.data.should.be.equal('failure');
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should delete the map', function(done) {
    $httpBackend.expect('DELETE', '/api/maps/'+mocks.mapMocks.xyzMap.id)
      .respond(mocks.mapMocks.xyzMap);

    MapService.deleteMap(mocks.mapMocks.xyzMap, function(map) {
      map.should.be.deep.equal(mocks.mapMocks.xyzMap);
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should fail to delete the map', function(done) {
    $httpBackend.expect('DELETE', '/api/maps/'+mocks.mapMocks.xyzMap.id)
      .respond(503, 'failure');

    MapService.deleteMap(mocks.mapMocks.xyzMap, function() {
    }, function(failure) {
      failure.status.should.be.equal(503);
      failure.data.should.be.equal('failure');
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should delete a datasource', function(done) {
    $httpBackend.expect('DELETE', '/api/maps/'+mocks.mapMocks.xyzMap.id+'/dataSources/'+mocks.mapMocks.xyzMap.dataSources[0].id)
      .respond(mocks.mapMocks.xyzMap);

    MapService.deleteDataSource(mocks.mapMocks.xyzMap, mocks.mapMocks.xyzMap.dataSources[0].id, function(map) {
      map.should.be.deep.equal(mocks.mapMocks.xyzMap);
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should fail to delete the map', function(done) {
    $httpBackend.expect('DELETE', '/api/maps/'+mocks.mapMocks.xyzMap.id+'/dataSources/'+mocks.mapMocks.xyzMap.dataSources[0].id)
      .respond(503, 'failure');

    MapService.deleteDataSource(mocks.mapMocks.xyzMap, mocks.mapMocks.xyzMap.dataSources[0].id, function() {
    }, function(failure) {
      failure.status.should.be.equal(503);
      failure.data.should.be.equal('failure');
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should save the map', function(done) {
    $httpBackend.expect('PUT', '/api/maps/'+mocks.mapMocks.xyzMap.id, mocks.mapMocks.xyzMap)
      .respond(mocks.mapMocks.xyzMap);

    MapService.saveMap(mocks.mapMocks.xyzMap, function(map) {
      map.should.be.deep.equal(mocks.mapMocks.xyzMap);
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should fail to save the map', function(done) {
    $httpBackend.expect('PUT', '/api/maps/'+mocks.mapMocks.xyzMap.id, mocks.mapMocks.xyzMap)
      .respond(503, 'failure');

    MapService.saveMap(mocks.mapMocks.xyzMap, function() {
    }, function(failure) {
      failure.status.should.be.equal(503);
      failure.data.should.be.equal('failure');
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should get the features for the map', function(done) {
    $httpBackend.expect('GET', '/api/maps/'+mocks.mapMocks.xyzMap.id+'/features?west=-180&south=-85&east=180&north=85&zoom=0')
      .respond(mocks.mapMocks.featureMock);

    MapService.getFeatures(mocks.mapMocks.xyzMap, -180, -85, 180, 85, 0, function(features) {
      features.should.be.deep.equal(mocks.mapMocks.featureMock);
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should fail to get the features for the map', function(done) {
    $httpBackend.expect('GET', '/api/maps/'+mocks.mapMocks.xyzMap.id+'/features?west=-180&south=-85&east=180&north=85&zoom=0')
      .respond(503, 'failure');

    MapService.getFeatures(mocks.mapMocks.xyzMap, -180, -85, 180, 85, 0, function() {
    },function(failure) {
      failure.status.should.be.equal(503);
      failure.data.should.be.equal('failure');
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should get the wmsGetCapabilities for the map', function(done) {
    $httpBackend.expect('GET', '/api/maps/wmsFeatureRequest?wmsUrl=http:%2F%2Fexample.com')
      .respond(mocks.mapDiscoveryMocks.wmsGetCapabilities);

    MapService.getWmsGetCapabilities('http://example.com', function(wmsFeatureRequest) {
      wmsFeatureRequest.should.be.deep.equal(mocks.mapDiscoveryMocks.wmsGetCapabilities);
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should discover the the map type', function(done) {
    $httpBackend.expect('GET', '/api/maps/discoverMap?url=http:%2F%2Fexample.com')
      .respond(mocks.mapDiscoveryMocks.wmsMapDiscovery);

    MapService.discoverMap('http://example.com', function(discoverMap) {
      discoverMap.should.be.deep.equal(mocks.mapDiscoveryMocks.wmsMapDiscovery);
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should create a new map', function(done) {

    sandbox.stub(FormData.prototype, 'append', function(key, value) {
      this[key] = value;
    });

    var formData = new FormData();
    var xyzMap = JSON.parse(JSON.stringify(mocks.mapMocks.xyzMap));
    for (var i = 0; i < xyzMap.dataSources.length; i++) {
      if (xyzMap.dataSources[i].file) {
        formData.append('mapFile', xyzMap.dataSources[i].file);
        xyzMap.dataSources[i].file = {name: xyzMap.dataSources[i].file.name};
      }
    }
    formData.append('map', JSON.stringify(xyzMap));

    var mock = sandbox.mock($);

    var expectation = mock.expects('ajax').withArgs(sinon.match({
      url:'/api/maps',
      type: 'POST',
      data: sinon.match(function(data) {
        return _.isEqual(data, formData);
      }, 'POST data is not correct')
    }));
    expectation.once();
    expectation.yieldsTo('success', mocks.mapMocks.xyzMap);


    MapService.createMap(mocks.mapMocks.xyzMap, function(response) {
      response.should.be.deep.equal(mocks.mapMocks.xyzMap);
      done();
    });

    expectation.verify();

  });

});
