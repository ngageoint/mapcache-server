
var angular = require('angular')
  , $ = require('jquery')
  , sinon  = require('sinon')
  , angularMocks = require('angular-mocks');

describe('color picker directive tests', function() {
  var $compile,
      $scope,
      $rootScope,
      sandbox;

  var elementTpl = '<div class="input-group" color-picker="color">' +
    '<input type="text" value="color" class="form-control" />' +
    '<span class="input-group-addon"><i></i></span>' +
  '</div>';

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  beforeEach(inject(function(_$compile_, _$rootScope_){
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $scope = _$rootScope_.$new();
  }));

  it('should set the color', function(done) {
    $scope.color = "#333333";

    var element = $compile(elementTpl)($scope);
    $scope.$digest();

    $scope.$watch('color', function() {
      $scope.color.should.be.equal("#000000");
      done();
    });

    var input = $(element).find('input[type=text]');
    input.val('#000000').trigger('keyup');

  });

});
