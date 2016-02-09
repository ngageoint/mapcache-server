var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , mocks = require('../mocks');

require('angular-mocks');

describe('Map Service tests', function() {

  var MapService;

  var sandbox;

  before(function() {
    require('../../app/mapcache/map');
  });

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_MapService_){
    MapService = _MapService_;
  }));

  it('should create the MapService', function() {
    should.exist(MapService);
  });
});
