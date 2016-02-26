var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , mocks = require('../mocks');

require('angular-mocks');

describe('NavController tests', function() {

  var UserService
    , scope
    , $rootScope
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

  beforeEach(inject(function(_UserService_, $injector){
    $location = $injector.get('$location');
    UserService = sandbox.mock(_UserService_);
  }));

  beforeEach(inject(function(_$rootScope_, $controller){
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    ctrl = $controller('NavController', {$scope: scope});
    scope.$apply();
  }));

  it('should create the NavController', function() {
    should.exist(ctrl);
  });

  it('should set the user information', function() {
    $location.path('/signin');
    $rootScope.$emit('login', {
      token: '5',
      user: mocks.userMocks.adminUser,
      isAdmin: true
    });
    scope.$apply();
    scope.token.should.be.equal('5');
    scope.myself.should.be.deep.equal(mocks.userMocks.adminUser);
    scope.amAdmin.should.be.equal(true);
  });

  it('should logout', function() {
    $rootScope.$emit('logout');
    scope.$apply();
    should.not.exist(scope.token);
    should.not.exist(scope.myself);
    should.not.exist(scope.amAdmin);
  });

});
