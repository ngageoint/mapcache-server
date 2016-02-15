var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
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

    MapService.getMap(mocks.mapMocks.xyzMap.id).then(function(success) {
      success.data.should.be.deep.equal(mocks.mapMocks.xyzMap);
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

});
