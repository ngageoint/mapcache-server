var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , $ = require('jquery')
  , _ = require('underscore')
  , mocks = require('../mocks');

require('angular-mocks');

describe('Local Storage Service tests', function() {

  var LocalStorageService
    , $window;

  var sandbox;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_LocalStorageService_, $injector){
    LocalStorageService = _LocalStorageService_;
    $window = $injector.get('$window');
  }));

  it('should create the LocalStorageService', function() {
    should.exist(LocalStorageService);
  });

  it('should get the token', function(){
    $window.localStorage.setItem('token', 'token');
    var token = LocalStorageService.getToken();
    var windowToken = $window.localStorage.getItem('token');
    token.should.be.equal(windowToken);
  });

  it('should set the token', function() {
    LocalStorageService.setToken('token');
    var token = $window.localStorage.getItem('token');
    token.should.be.equal('token');
  });

  it('should set the token', function() {
    LocalStorageService.removeToken();
    var token = $window.localStorage.getItem('token');
    should.not.exist(token);
  });

});
