var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , sinonAsPromised = require('sinon-as-promised')
  , mocks = require('../mocks');

require('angular-mocks');

describe('MapsController tests', function() {

  var MapService
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

  beforeEach(inject(function(_MapService_, $injector){
    $location = $injector.get('$location');
    MapService = sandbox.mock(_MapService_);
  }));

  beforeEach(angular.mock.inject(function ($q) {
    sinonAsPromised($q);
  }));

  beforeEach(function() {
    MapService.expects('getAllMaps').resolves(mocks.mapMocks.maps).once();
  });

  beforeEach(inject(function($rootScope, $controller){
    scope = $rootScope.$new();
    ctrl = $controller('MapsController', {$scope: scope});
    scope.$apply();
  }));

  it('should create the MapsController', function() {
    should.exist(ctrl);
    MapService.verify();
  });

});
