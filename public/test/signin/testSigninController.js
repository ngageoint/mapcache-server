var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , sinonAsPromised = require('sinon-as-promised')
  , mocks = require('../mocks');

require('angular-mocks');

describe('SigninController tests', function() {

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
    ctrl = $controller('SigninController', {$scope: scope});
    scope.$apply();
  }));

  beforeEach(angular.mock.inject(function ($q) {
    sinonAsPromised($q);
  }));

  it('should create the SigninController', function() {
    should.exist(ctrl);
  });

  it('should signin', function() {
    UserService.expects('login').resolves(mocks.userMocks.adminUser).once().alwaysCalledWith({username: 'admin', password: 'password'});

    scope.username = 'admin';
    scope.password = 'password';

    var spy = sandbox.spy($rootScope, '$broadcast');

    scope.signin();
    scope.$apply();

    spy.calledOnce.should.be.equal(true);

    UserService.verify();
  });

  it('should fail to signin', function() {
    UserService.expects('login').rejects({status: 503}).once().alwaysCalledWith({username: 'admin', password: 'password'});

    scope.signin();
    scope.$apply();

    scope.status.should.be.equal(503);

    UserService.verify();
  });

  it('should set the status message', function() {
    scope.showStatusMessage('title', 'message', 'level');
    scope.statusTitle.should.be.equal('title');
    scope.statusMessage.should.be.equal('message');
    scope.statusLevel.should.be.equal('level');
    scope.showStatus.should.be.equal(true);
    scope.showStatusMessage();
  });

  it('should signup', function() {
    var expectation = UserService.expects('signup');
    expectation.alwaysCalledWith(mocks.userMocks.newUser);
    expectation.callsArg(1);
    scope.user = JSON.parse(JSON.stringify(mocks.userMocks.newUser));

    scope.signup();

    scope.statusTitle.should.be.equal("Success");
    scope.statusMessage.should.be.equal("Account created, contact an administrator to activate your account.");
    scope.statusLevel.should.be.equal("alert-success");
    scope.showStatus.should.be.equal(true);
  });

  it('should fail to signup', function() {
    var expectation = UserService.expects('signup');
    expectation.alwaysCalledWith(mocks.userMocks.newUser);
    expectation.callsArgWith(2, {responseText: 'fail'});
    scope.user = JSON.parse(JSON.stringify(mocks.userMocks.newUser));

    scope.signup();

    scope.statusTitle.should.be.equal("There was a problem creating your account");
    scope.statusMessage.should.be.equal("fail");
    scope.statusLevel.should.be.equal("alert-danger");
    scope.showStatus.should.be.equal(true);
  });

  it('should have progress when signing up', function() {
    var expectation = UserService.expects('signup');
    expectation.alwaysCalledWith(mocks.userMocks.newUser);
    expectation.callsArgWith(3, {lengthComputable: 5, loaded: 100, total: 100});
    scope.user = JSON.parse(JSON.stringify(mocks.userMocks.newUser));

    scope.signup();

    scope.uploading.should.be.equal(true);
    scope.uploadProgress.should.be.equal(100);
  });

});
