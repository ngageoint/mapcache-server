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

  // it('should load the maps', function(done) {
  //   scope.$watch('sources', function(maps) {
  //     if (maps) {
  //       maps.length.should.be.equal(mockMaps.length);
  //       maps[0].totalSize.should.be.equal(216);
  //       done();
  //     }
  //   });
  //   scope.$apply();
  // });
  //
  // it('should delete a cache', function(done) {
  //   var mockReturn = JSON.parse(JSON.stringify(mockCaches[0]));
  //   CacheServiceMock
  //     .expects('deleteCache')
  //     .withArgs(mockReturn, null)
  //     .once()
  //     .yields(mockReturn);
  //
  //     scope.$watch('caches', function(caches) {
  //       if (caches) {
  //         scope.deleteCache(mockReturn, null);
  //         CacheServiceMock.verify();
  //         mockReturn.deleted.should.be.equal(true);
  //         done();
  //       }
  //     });
  //     scope.$apply();
  // });
  //
  // it('should delete a cache format', function(done) {
  //   var mockReturn = JSON.parse(JSON.stringify(mockCaches[0]));
  //   CacheServiceMock
  //     .expects('deleteCache')
  //     .withArgs(mockReturn, 'xyz')
  //     .once()
  //     .yields(mockReturn);
  //
  //     scope.$watch('caches', function(caches) {
  //       if (caches) {
  //         should.exist(mockReturn.formats.xyz);
  //         scope.deleteCache(mockReturn, 'xyz', null);
  //         CacheServiceMock.verify();
  //         should.not.exist(mockReturn.formats.xyz);
  //         done();
  //       }
  //     });
  //     scope.$apply();
  // });
  //
  // it('should undelete a cache and redirect to the cache', function(done) {
  //   var mockReturn = JSON.parse(JSON.stringify(mockCaches[0]));
  //   CacheServiceMock
  //     .expects('createCache')
  //     .withArgs(mockReturn)
  //     .once()
  //     .yields(mockReturn);
  //
  //   var spy = sandbox.spy($location, 'path');
  //
  //   scope.$watch('caches', function(caches) {
  //     if (caches) {
  //       scope.undeleteCache(mockReturn);
  //       CacheServiceMock.verify();
  //       spy.calledOnce.should.be.equal(true);
  //       spy.alwaysCalledWithExactly('/cache/'+mockReturn.id).should.be.equal(true);
  //       done();
  //     }
  //   });
  //   scope.$apply();
  // });
  //
  // it('should try to undelete a cache and handle the error', function(done) {
  //   var mockReturn = JSON.parse(JSON.stringify(mockCaches[0]));
  //   CacheServiceMock
  //     .expects('createCache')
  //     .withArgs(mockReturn)
  //     .once()
  //     .callsArgWith(2, 'failure', 500);
  //
  //   scope.$watch('caches', function(caches) {
  //     if (caches) {
  //       scope.undeleteCache(mockReturn);
  //       CacheServiceMock.verify();
  //       scope.cacheCreationError.error.should.be.equal('failure');
  //       scope.cacheCreationError.status.should.be.equal(500);
  //       done();
  //     }
  //   });
  //   scope.$apply();
  // });
  //
  // it('should return a format name', function(done) {
  //   var name = scope.formatName('xyz');
  //   should.exist(name);
  //   done();
  // });
  //
  // it('should delete a map', function(done) {
  //
  //   var mockReturn = JSON.parse(JSON.stringify(mockMaps[0]));
  //   MapServiceMock
  //     .expects('deleteMap')
  //     .withArgs(mockReturn)
  //     .once()
  //     .yields(mockReturn);
  //
  //   scope.deleteMap(mockReturn);
  //   mockReturn.deleted.should.be.equal(true);
  //   MapServiceMock.verify();
  //   done();
  // });
  //
  // it('should create a user on the scope when newUser is called', function(done) {
  //   should.not.exist(scope.user);
  //   scope.newUser();
  //   should.exist(scope.user);
  //   scope.user.should.be.empty; // jshint ignore:line
  //   done();
  // });
  //
  // it('should set a user on the scope when editUser is called', function(done) {
  //   var user = JSON.parse(JSON.stringify(mockUsers[0]));
  //   should.not.exist(scope.user);
  //   scope.editUser(user);
  //   should.exist(scope.user);
  //   scope.user.should.be.equal(user);
  //   done();
  // });
  //
  // it('should save the user', function(done) {
  //   var spy = sandbox.stub(UserService, "updateUser", function(userId, user, success, failure, progress){
  //     progress({
  //       lengthComputable: 100,
  //       loaded: 10,
  //       total: 10
  //     });
  //     success();
  //   });
  //
  //   var user = JSON.parse(JSON.stringify(mockUsers[0]));
  //   should.not.exist(scope.user);
  //   scope.editUser(user);
  //   should.exist(scope.user);
  //   scope.user.should.be.equal(user);
  //   scope.user.firstname = 'newname';
  //   scope.saveUser();
  //   spy.calledOnce.should.be.equal(true);
  //   scope.uploading.should.be.equal(true);
  //   scope.uploadProgress.should.be.equal(100);
  //   scope.saved.should.be.equal(true);
  //   scope.saving.should.be.equal(false);
  //
  //   done();
  // });
  //
  // it('should fail to save the user', function(done) {
  //   var user = JSON.parse(JSON.stringify(mockUsers[0]));
  //
  //   UserServiceMock
  //     .expects('updateUser')
  //     .withArgs(user.id)
  //     .once()
  //     .callsArgWith(3, {responseText: 'fail'});
  //
  //   should.not.exist(scope.user);
  //   scope.editUser(user);
  //   should.exist(scope.user);
  //   scope.user.should.be.equal(user);
  //   scope.user.firstname = 'newname';
  //   scope.saveUser();
  //   UserServiceMock.verify();
  //   scope.saving.should.be.equal(false);
  //   scope.error.should.be.equal('fail');
  //
  //   done();
  // });
  //
  // it('should create a new user', function(done) {
  //   var spy = sandbox.stub(UserService, "createUser", function(user, success, failure, progress){
  //     progress({
  //       lengthComputable: 100,
  //       loaded: 10,
  //       total: 10
  //     });
  //     user.id = '5';
  //     success(user);
  //   });
  //
  //   var numberOfUsers = scope.users.length;
  //   // mirror what angular does internally
  //   scope.user = {};
  //   scope.user.firstname = 'newname';
  //   scope.saveUser();
  //   spy.calledOnce.should.be.equal(true);
  //   scope.uploading.should.be.equal(true);
  //   scope.uploadProgress.should.be.equal(100);
  //   scope.saved.should.be.equal(true);
  //   scope.saving.should.be.equal(false);
  //   scope.users.length.should.be.equal(numberOfUsers+1);
  //   scope.users[scope.users.length-1].id.should.be.equal('5');
  //
  //   done();
  // });
  //
  // it('should activate a user', function(done) {
  //   var spy = sandbox.stub(UserService, "updateUser", function(userId, user, success){
  //     success(user);
  //   });
  //
  //   var user = JSON.parse(JSON.stringify(mockUsers[0]));
  //   user.active = false;
  //   scope.activateUser(user);
  //   spy.calledOnce.should.be.equal(true);
  //   scope.saved.should.be.equal(true);
  //   user.active.should.be.equal(true);
  //
  //   done();
  // });
  //
  // it('should fail to activate a user', function(done) {
  //   var spy = sandbox.stub(UserService, "updateUser", function(userId, user, success, failure){
  //     failure({responseText: 'fail'});
  //   });
  //
  //   var user = JSON.parse(JSON.stringify(mockUsers[0]));
  //   user.active = false;
  //   scope.activateUser(user);
  //   spy.calledOnce.should.be.equal(true);
  //   user.active.should.be.equal(false);
  //   scope.error.should.be.equal('fail');
  //
  //   done();
  // });
  //
  // it('should refresh the users', function(done) {
  //   var newMockUsers = JSON.parse(JSON.stringify(mockUsers));
  //   newMockUsers.push({"id":"5", "name":"newperson"});
  //   getAllUsersExpectation.onSecondCall().resolves(newMockUsers);
  //   getAllUsersExpectation.twice();
  //   scope.refresh();
  //   scope.$apply();
  //   scope.users.length.should.be.equal(mockUsers.length+1);
  //   UserServiceMock.verify();
  //   done();
  // });
});
