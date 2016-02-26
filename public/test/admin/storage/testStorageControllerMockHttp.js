var should = require('chai').should()
  , angular = require('angular')
  , sinon  = require('sinon')
  , sinonAsPromised = require('sinon-as-promised')
  , mocks = require('../../mocks');

require('angular-mocks');

describe('StorageController', function() {

  var mockCaches = mocks.cacheMocks.caches;
  var mockMaps = mocks.mapMocks.maps;
  var mockRoles = mocks.roleMocks.roles;
  var mockUsers = mocks.userMocks.users;

  var scope;
  var ctrl;
  var MapServiceMock;
  var UserServiceMock;
  var ServerServiceMock;
  var $location;
  var httpBackend;
  var getAllMapsExpectation;
  var getRolesExpectation;
  var getAllUsersExpectation;
  var getServerInfoExpectation;

  var sandbox;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  before(function() {
    require('../../../app/admin/storage');
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(angular.mock.inject(function (MapService) {
    MapServiceMock = sandbox.mock(MapService);
  }));

  beforeEach(angular.mock.inject(function (UserService) {
    UserServiceMock = sandbox.mock(UserService);
  }));

  beforeEach(angular.mock.inject(function (ServerService) {
    ServerServiceMock = sandbox.mock(ServerService);
  }));

  beforeEach(angular.mock.inject(function ($q) {
    sinonAsPromised($q);
  }));

  beforeEach(function() {
    getAllMapsExpectation = MapServiceMock.expects('getAllMaps').resolves(mockMaps);
    getRolesExpectation = UserServiceMock.expects('getRoles').resolves(mockRoles);
    getAllUsersExpectation = UserServiceMock.expects('getAllUsers');
    getAllUsersExpectation.onFirstCall().resolves(mockUsers);
    getServerInfoExpectation = ServerServiceMock.expects('getServerInfo').yields({data:'here'});
  });

  beforeEach(inject(function($rootScope, $controller, $httpBackend, $injector){
    $location = $injector.get('$location');
    httpBackend = $httpBackend;

    httpBackend.when('GET', '/api/caches')
      .respond(mockCaches);

    scope = $rootScope.$new();
    ctrl = $controller('StorageController', {$scope: scope, $location: $location});
  }));

  afterEach(function() {
    httpBackend.verifyNoOutstandingExpectation();
    httpBackend.verifyNoOutstandingRequest();
  });

  it('should load the caches via http backend', function(done) {
    httpBackend.flush();
    scope.caches.length.should.be.equal(mockCaches.length);
    scope.caches[0].totalSize.should.be.equal(2060392);
    done();
  });

});
