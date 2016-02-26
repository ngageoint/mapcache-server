var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , $ = require('jquery')
  , _ = require('underscore')
  , mocks = require('../mocks');

require('angular-mocks');

describe('auth interceptor tests', function() {

  var authService
    , httpBuffer
    , $http
    , $q
    , $httpBackend;

  var sandbox;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  beforeEach(angular.mock.module('http-auth-interceptor-buffer'));
  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_httpBuffer_, _$q_, $injector){
    httpBuffer = _httpBuffer_;
    $q = _$q_;
    $httpBackend = $injector.get('$httpBackend');
  }));

  it('should create the auth interceptor buffer', function() {
    should.exist(httpBuffer);
  });

  it('should retry all gets', function() {
    httpBuffer.append({
      method: 'POST',
      url: 'http://example.com/post'
    }, $q.defer());
    httpBuffer.append({
      method: 'GET',
      url: 'http://example.com'
    }, $q.defer());
    httpBuffer.append({
      method: 'GET',
      url: 'http://example.com/2'
    }, $q.defer());

    $httpBackend.expect('GET', 'http://example.com').respond({});
    $httpBackend.expect('GET', 'http://example.com/2').respond({});

    httpBuffer.retryAllGets(function(config) { return config; });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should retry all', function() {
    httpBuffer.append({
      method: 'POST',
      url: 'http://example.com/post'
    }, $q.defer());
    httpBuffer.append({
      method: 'GET',
      url: 'http://example.com'
    }, $q.defer());
    httpBuffer.append({
      method: 'GET',
      url: 'http://example.com/2'
    }, $q.defer());

    $httpBackend.expect('POST', 'http://example.com/post').respond({});
    $httpBackend.expect('GET', 'http://example.com').respond({});
    $httpBackend.expect('GET', 'http://example.com/2').respond({});

    httpBuffer.retryAll(function(config) { return config; });

    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });
});
