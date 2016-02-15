var angular = require('angular')
  , $ = require('jquery')
  , mocks = require('../../mocks')
  , sinon  = require('sinon')
  , _ = require('underscore')
  , angularMocks = require('angular-mocks');

require('../../../vendor/angular-ui-select');

describe('map edit page tests', function() {

  var sandbox;
  var $compile;
  var $rootScope;
  var $location;
  var $scope;
  var $controller;
  var styleSpy;

  var MapService;
  var MapServiceMock;

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
    MapServiceMock.expects('getMap')
      .once()
      .yields(JSON.parse(JSON.stringify(mocks.mapMocks.xyzMap)));
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(function() {
    angular.mock.module(function($provide) {
      $provide.value('MapService', MapService);
    });
  });

  beforeEach(inject(function(_$compile_, _$rootScope_, _$location_, _$controller_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $location = _$location_;
    $controller = _$controller_;
    $scope = _$rootScope_.$new();
  }));

  afterEach(function() {

  });

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('should call the set style tab with the id', function(done) {

    $scope.map = {
      id: mocks.mapMocks.xyzMap.id
    };

    var element = $compile('<div ng-app="mapcache"><div ng-view></div></div>')($scope);
    $location.path('/map/'+mocks.mapMocks.xyzMap.id+'/edit');
    $scope.$apply();

    var div = $(element).find('div');
    var theScope = angular.element(div).scope();
    var styleSpy = sinon.spy(theScope, 'setStyleTab');

    var tab = $(element).find('.datasource-tabs li a:eq(1)');
    tab.click();

    styleSpy.withArgs(mocks.mapMocks.xyzMap.dataSources[1].id).calledOnce.should.be.equal(true);

    done();
  });

});
