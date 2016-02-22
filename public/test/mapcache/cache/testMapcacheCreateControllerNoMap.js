var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , sinonAsPromised = require('sinon-as-promised')
  , mocks = require('../../mocks');

require('angular-mocks');

describe('MapcacheCreateController tests', function() {

  var CacheService
    , MapService
    , ServerService
    , scope
    , ctrl
    , $location;

  var sandbox;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_CacheService_, _MapService_, _ServerService_, $injector){
    $location = $injector.get('$location');
    CacheService = sandbox.mock(_CacheService_);
    MapService = sandbox.mock(_MapService_);
    ServerService = sandbox.mock(_ServerService_);
  }));

  beforeEach(angular.mock.inject(function ($q) {
    sinonAsPromised($q);
  }));

  beforeEach(function() {
    ServerService.expects('getMaxCacheSize').yields(mocks.serverMocks.maxCacheSize).once();
  });

  beforeEach(function() {
    MapService.expects('getAllMaps').resolves(mocks.mapMocks.maps).once();
  });

  beforeEach(inject(function($rootScope, $controller){
    scope = $rootScope.$new();
    ctrl = $controller('MapcacheCreateController', {$scope: scope});
    scope.$apply();
  }));

  it('should create the MapcacheCreateController', function() {
    should.exist(ctrl);
    ctrl.loadingMaps.should.be.equal(false);
    ctrl.maps.should.be.deep.equal(mocks.mapMocks.maps);
    ServerService.verify();
    MapService.verify();
  });

  it('should check required fields', function() {
    var fieldsSet = ctrl.requiredFieldsSet();
    ctrl.unsetFields.should.include('cache map');
    fieldsSet.should.be.equal(false);
  });

});
