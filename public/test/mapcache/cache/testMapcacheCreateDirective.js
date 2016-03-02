var angular = require('angular')
  , $ = require('jquery')
  , mocks = require('../../mocks')
  , sinon  = require('sinon')
  , angularMocks = require('angular-mocks');

require('../../../vendor/angular_ui_select');

describe('map edit page tests', function() {

  var sandbox;
  var $compile;
  var $rootScope;
  var $location;
  var $scope;
  var $controller;

  var MapService;
  var ServerService;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_$compile_, _$rootScope_, _$location_, _$controller_, _MapService_, _ServerService_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $location = _$location_;
    $controller = _$controller_;
    MapService = sandbox.mock(_MapService_);
    ServerService = sandbox.mock(_ServerService_);
    $scope = _$rootScope_.$new();
  }));

  beforeEach(function() {
    MapService.expects('getMap')
      .once()
      .yields(JSON.parse(JSON.stringify(mocks.mapMocks.xyzMap)));
  });

  beforeEach(function() {
    ServerService.expects('getMaxCacheSize')
      .once()
      .yields(JSON.parse(JSON.stringify({maximumCacheSize: 4})));
  });

  it('set the directions', function() {

    $scope.map = {
      id: mocks.mapMocks.xyzMap.id
    };

    var element = $compile('<div ng-app="mapcache"><div ng-view></div></div>')($scope);
    $location.path('/create/'+mocks.mapMocks.xyzMap.id);
    $scope.$apply();

    $(element).find('.west-group input:first').val('-106.05').trigger('change');
    $(element).find('.east-group input:first').val('-105.5').trigger('change');
    $scope.$apply();

    var div = $(element).find('div.container');
    var theScope = angular.element(div).scope();

    parseFloat(theScope.create.bb.west).should.be.lessThan(parseFloat(theScope.create.bb.east));

    var westGroup = $(element).find('.west-group');
    westGroup.hasClass('has-error').should.be.equal(false);
  });

});
