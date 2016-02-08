var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon');

require('angular-mocks');

describe('MapCreateController tests', function() {

  var scope;
  var ctrl;

  var MapService;
  var MapServiceMock;

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

  beforeEach(inject(function($rootScope, $controller){
    scope = $rootScope.$new();
    ctrl = $controller('MapCreateController', {$scope: scope});
  }));

  it('should create the MapCreateController', function(done) {
    should.exist(ctrl);
    done();
  });

});
