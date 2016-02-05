var angular = require('angular')
  , should = require('chai').should();
require('angular-mocks');

describe('AboutController', function() {

  var scope;
  var ctrl;

  before(function() {
    angular.module('mapcache', [  ]);
    require('../../app/about');
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function($rootScope, $controller) {
    scope = $rootScope.$new();
    ctrl = $controller('AboutController', {$scope: scope});
  }));

  it('should create the AboutController', function() {
    should.exist(ctrl);
    scope.about.should.be.equal('About');
  });
});
