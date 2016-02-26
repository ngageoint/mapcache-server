var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , sinonAsPromised = require('sinon-as-promised')
  , mocks = require('../mocks');

require('angular-mocks');

describe('UserController tests', function() {

  var UserService
    , scope
    , $rootScope
    , ctrl
    , $location
    , $timeout;

  var sandbox;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_UserService_, $injector){
    $timeout = $injector.get('$timeout');
    $location = $injector.get('$location');
    UserService = sandbox.mock(_UserService_);
  }));

  beforeEach(inject(function(_$rootScope_, $controller){
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    scope.options = {};
    ctrl = $controller('UserController', {$scope: scope, user: JSON.parse(JSON.stringify(mocks.userMocks.adminUser))});
    scope.$apply();
  }));

  beforeEach(angular.mock.inject(function ($q) {
    sinonAsPromised($q);
  }));

  it('should create the UserController', function() {
    should.exist(ctrl);
    scope.originalUser.should.be.deep.equal(mocks.userMocks.adminUser);
  });

  it('should save myself', function() {
    UserService.expects('updateMyself').callsArg(1).once();
    scope.saveUser();
    scope.statusTitle.should.be.equal('Success');
    scope.statusMessage.should.be.equal('Your account information has been updated.');
    scope.statusLevel.should.be.equal('alert-success');
    scope.showUserStatus.should.be.equal(true);
    UserService.verify();
  });

  it('should cancel the edit', function() {
    scope.user.username = 'newname';
    scope.cancel();
    scope.$apply();
    scope.user.username.should.be.equal(mocks.userMocks.adminUser.username);
  });

  it('should fail to update the password', function() {
    scope.updatePassword();
    scope.passwordStatus.should.be.deep.equal({status: 'error', msg: 'password cannot be blank'});
  });

  it('should fail to update the password because they do not match', function() {
    scope.user.password = 'new';
    scope.user.passwordconfirm = 'new2';
    scope.updatePassword();
    scope.passwordStatus.should.be.deep.equal({status:'error', msg:'passwords do not match'});
  });

  it('should update the password', function() {
    var spy = sandbox.spy($location, 'path');
    UserService.expects('updateMyPassword').resolves({}).once().alwaysCalledWith({password: 'new', passwordconfirm:'new'});

    scope.user.password = 'new';
    scope.user.passwordconfirm = 'new';
    scope.updatePassword();
    scope.$apply();
    scope.user.password.should.be.equal("");
    scope.user.passwordconfirm.should.be.equal("");
    scope.passwordStatus.should.be.deep.equal({status: 'success', msg: 'password successfully updated, redirecting to the login page'});
    $timeout.flush(5001);
    spy.calledOnce.should.be.equal(true);
    spy.alwaysCalledWithExactly('/signin').should.be.equal(true);
    UserService.verify();
  });

});
