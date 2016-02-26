var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , mocks = require('../mocks');

require('angular-mocks');

describe('auth interceptor tests', function() {

  var authService
    , httpBuffer
    , $http
    , $httpBackend;

  var sandbox;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  beforeEach(angular.mock.module('http-auth-interceptor'));
  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_authService_, _httpBuffer_, $injector, _$http_){
    authService = _authService_;
    httpBuffer = sandbox.mock(_httpBuffer_);
    $http = _$http_;
    $httpBackend = $injector.get('$httpBackend');
  }));

  it('should create the auth interceptor', function() {
    should.exist(authService);
  });

  it('should confirm new login', function() {
    httpBuffer.expects('retryAllGets').once();
    authService.loginConfirmed({
      newUser: true
    });
    httpBuffer.verify();
  });

  it('should confirm login', function() {
    httpBuffer.expects('retryAll').once();
    authService.loginConfirmed({});
    httpBuffer.verify();
  });

  it('should have a response error', function() {
    httpBuffer.expects('append').once();
    $httpBackend.expect('GET', '/nowhere')
      .respond(401, 'no');
    $http.get('/nowhere');
    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
    httpBuffer.verify();
  });

});
