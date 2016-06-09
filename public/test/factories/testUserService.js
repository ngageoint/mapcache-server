var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , $ = require('jquery')
  , _ = require('underscore')
  , mocks = require('../mocks');

require('angular-mocks');

describe('User Service tests', function() {

  var UserService
    , LocalStorageService
    , $location
    , $httpBackend;

  var sandbox;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_UserService_, _LocalStorageService_, $injector){
    UserService = _UserService_;
    LocalStorageService = _LocalStorageService_;
    $location = $injector.get('$location');
    $httpBackend = $injector.get('$httpBackend');
  }));

  beforeEach(function(){
    sandbox.stub(FormData.prototype, 'append', function(key, value) {
      this[key] = value;
    });
  });

  it('should create the UserService', function() {
    should.exist(UserService);
  });

  it('should sign up a new user', function(done) {

    var user = JSON.parse(JSON.stringify(mocks.userMocks.newUser));
    var mock = sandbox.mock($);

    var expectation = mock.expects('ajax').withArgs(sinon.match({
      url:'/api/users',
      type: 'POST',
      data: sinon.match(function(data) {
        return data.username === user.username && data.password === user.password && data.firstname === user.firstname && data.lastname === user.lastname;
      }, 'User POST data is not correct')
    }));
    expectation.once();
    expectation.yieldsTo('success', mocks.userMocks.adminUser);


    UserService.signup(user, function(response) {
      response.should.be.deep.equal(mocks.userMocks.adminUser);
      done();
    });

    expectation.verify();

  });

  it('should create a new user', function(done) {

    LocalStorageService.setToken('5');

    var user = JSON.parse(JSON.stringify(mocks.userMocks.newUser));
    var mock = sandbox.mock($);

    var expectation = mock.expects('ajax').withArgs(sinon.match({
      url:'/api/users?access_token=5',
      type: 'POST',
      data: sinon.match(function(data) {
        return data.username === user.username && data.password === user.password && data.firstname === user.firstname && data.lastname === user.lastname;
      }, 'User POST data is not correct')
    }));
    expectation.once();
    expectation.yieldsTo('success', mocks.userMocks.adminUser);


    UserService.createUser(user, function(response) {
      response.should.be.deep.equal(mocks.userMocks.adminUser);
      done();
    });

    expectation.verify();

  });

  it('should update a user', function(done) {

    LocalStorageService.setToken('5');

    var user = JSON.parse(JSON.stringify(mocks.userMocks.adminUser));
    var mock = sandbox.mock($);

    var expectation = mock.expects('ajax').withArgs(sinon.match({
      url:'/api/users/'+mocks.userMocks.adminUser.id+'?access_token=5',
      type: 'PUT',
      data: sinon.match(function(data) {
        return data.id === user.id;
      }, 'User PUT data is not correct')
    }));
    expectation.once();
    expectation.yieldsTo('success', mocks.userMocks.adminUser);


    UserService.updateUser(mocks.userMocks.adminUser.id, user, function(response) {
      response.should.be.deep.equal(mocks.userMocks.adminUser);
      done();
    });

    expectation.verify();

  });

  it('should delete a user', function(done) {
    $httpBackend.expect('DELETE', '/api/users/'+mocks.userMocks.adminUser.id)
      .respond(204);

    UserService.deleteUser(mocks.userMocks.adminUser).then(function(data) {
      data.status.should.be.equal(204);
      done();
    });
    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should get the roles', function(done) {
    $httpBackend.expect('GET', '/api/roles')
      .respond(mocks.userMocks.roles);

    UserService.getRoles().then(function(data) {
      data.should.be.deep.equal(mocks.userMocks.roles);
      done();
    });
    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should login an admin', function(done){
    $httpBackend.expect('POST', '/api/login')
      .respond(mocks.userMocks.loginAdminUserResponse);

    UserService.login(mocks.userMocks.loginUser)
      .then(function(success) {
        success.user.should.be.deep.equal(mocks.userMocks.adminUser);
        success.token.should.be.deep.equal(mocks.userMocks.loginAdminUserResponse.token);
        LocalStorageService.getToken().should.be.equal(mocks.userMocks.loginAdminUserResponse.token);
        UserService.myself.should.be.deep.equal(mocks.userMocks.adminUser);
        success.isAdmin.should.be.equal(true);
        UserService.amAdmin.should.be.equal(true);
        done();
      });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should login a user', function(done){
    $httpBackend.expect('POST', '/api/login')
      .respond(mocks.userMocks.loginRegularUserResponse);

    UserService.login(mocks.userMocks.loginUser)
      .then(function(success) {
        success.user.should.be.deep.equal(mocks.userMocks.regularUser);
        success.token.should.be.deep.equal(mocks.userMocks.loginRegularUserResponse.token);
        LocalStorageService.getToken().should.be.equal(mocks.userMocks.loginRegularUserResponse.token);
        UserService.myself.should.be.deep.equal(mocks.userMocks.regularUser);
        success.isAdmin.should.be.equal(false);
        UserService.amAdmin.should.be.equal(false);
        done();
      });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should logout the user', function(done) {
    var spy = sandbox.spy($location, 'path');
    $httpBackend.expect('POST', '/api/logout')
      .respond({});

    UserService.logout().then(function() {
      should.not.exist(UserService.myself);
      should.not.exist(UserService.amAdmin);
      should.not.exist(LocalStorageService.getToken());
      spy.calledOnce.should.be.equal(true);
      spy.alwaysCalledWithExactly('/signin').should.be.equal(true);
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should get myself', function(done){
    $httpBackend.expect('GET', '/api/users/myself')
      .respond(mocks.userMocks.adminUser);

    UserService.getMyself().then(function(user) {
      user.should.be.deep.equal(mocks.userMocks.adminUser);
      done();
    });
    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should get myself and verify roles', function(done){
    $httpBackend.expect('GET', '/api/users/myself')
      .respond(mocks.userMocks.adminUser);

    UserService.getMyself(['CREATE_CACHE']).then(function(user) {
      user.should.be.deep.equal(mocks.userMocks.adminUser);
      done();
    });
    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should get myself and fail to verify roles', function(done){
    var spy = sandbox.spy($location, 'path');
    $httpBackend.expect('GET', '/api/users/myself')
      .respond(mocks.userMocks.adminUser);

    UserService.getMyself(['DOES_NOT_EXIST']).then(function(user) {
      user.should.be.deep.equal(mocks.userMocks.adminUser);
      spy.calledOnce.should.be.equal(true);
      spy.alwaysCalledWithExactly('/signin').should.be.equal(true);
      done();
    });
    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should fail to get myself', function(done){
    $httpBackend.expect('GET', '/api/users/myself')
      .respond(503, 'failure');

    UserService.getMyself().then(function(user) {
      user.should.be.empty; // jshint ignore: line
      done();
    });
    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should update user', function(done) {

    var user = JSON.parse(JSON.stringify(mocks.userMocks.adminUser));

    var mock = sandbox.mock($);
    LocalStorageService.setToken('5');

    var expectation = mock.expects('ajax').withArgs(sinon.match({
      url:'/api/users/myself?access_token=5',
      type: 'PUT',
      data: sinon.match(function(data) {
        return data.id === user.id;
      }, 'User PUT data is not correct')
    }));
    expectation.once();
    expectation.yieldsTo('success', user);


    UserService.updateMyself(mocks.userMocks.adminUser, function(response) {
      response.should.be.deep.equal(mocks.userMocks.adminUser);
      expectation.verify();
      done();
    });

  });

  it('should update my password', function(done) {
    var user = JSON.parse(JSON.stringify(mocks.userMocks.adminUser));
    user.password = 'new';
    user.passwordconfirm = 'new';

    $httpBackend.expect('PUT', '/api/users/myself')
      .respond({});

    UserService.updateMyPassword(user).then(function() {
      should.not.exist(UserService.myself);
      should.not.exist(UserService.amAdmin);
      should.not.exist(LocalStorageService.getToken());
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should check the logged in user', function(done) {
    $httpBackend.expect('GET', '/api/users/myself')
      .respond(mocks.userMocks.adminUser);

    UserService.checkLoggedInUser().then(function() {
      UserService.myself.should.be.deep.equal(mocks.userMocks.adminUser);
      UserService.amAdmin.should.be.equal(true);
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should get a user', function(done) {
    $httpBackend.expect('GET', '/api/users')
      .respond(mocks.userMocks.users);

    UserService.getAllUsers().then(function(users) {
      users.should.be.deep.equal(mocks.userMocks.users);
      done();
    });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });


});
