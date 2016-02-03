
var angular = require('angular');
require('angular-mocks');

var sinon  = require('sinon');
var sinonAsPromised = require('sinon-as-promised');

describe('StorageController', function() {

  var mockCaches = [{
    name: 'Test 1',
    id: '5'
  }, {
    name: 'Test 2',
    id: '6'
  }];

  var mockMaps = [{
    name: 'Test Map 1',
    id: '5'
  }, {
    name: 'Test Map 2',
    id: '6'
  }];

  var mockRoles = [

  ];

  var mockUsers = [

  ];

  var scope;
  var ctrl;
  var CacheServiceMock;
  var MapServiceMock = {};
  var UserServiceMock = {};
  var $httpBackend;
  var CacheService;

  before(function() {
    angular.module('mapcache', [  ]);

    require('../../../app/admin/storage');

    CacheService = require('../../../app/factories/cache.service')();

    CacheServiceMock = sinon.mock(CacheService);
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(function() {
    angular.mock.module(function($provide) {
      $provide.value('CacheService', CacheService);
      $provide.value('MapService', MapServiceMock);
      $provide.value('UserService', UserServiceMock);
    });
  });

  beforeEach(angular.mock.inject(function ($q) {
    sinonAsPromised($q);
  }));

  beforeEach(function() {
    CacheService.getAllCaches = sinon.stub().resolves(mockCaches);
    MapServiceMock.getAllMaps = sinon.stub().resolves(mockMaps);
    UserServiceMock.getRoles = sinon.stub().resolves(mockRoles);
    UserServiceMock.getAllUsers = sinon.stub().resolves(mockUsers);
  });

  beforeEach(inject(function($rootScope, $controller, $injector){

    $httpBackend = $injector.get('$httpBackend');
    $httpBackend.when('GET', '/api/server').respond({
      woo: 'oop'
    });

    scope = $rootScope.$new();
    ctrl = $controller('StorageController', {$scope: scope});
  }));

  afterEach(function() {
     $httpBackend.verifyNoOutstandingExpectation();
     $httpBackend.verifyNoOutstandingRequest();
   });

  it('should create the StorageController', function(done) {
    should.exist(ctrl);

    scope.$watch('caches', function(caches) {
      console.log('caches', caches);
      if (caches) {
        caches.length.should.be.equal(2);
        done();
      }
    });
    $httpBackend.flush();
  });

  it('should delete a cache', function(done) {
    var mockReturn = JSON.parse(JSON.stringify(mockCaches[0]));
    var mock = CacheServiceMock
      .expects('deleteCache')
      .withArgs(mockReturn, null)
      .once()
      .yields(mockReturn);

      scope.$watch('caches', function(caches) {
        if (caches) {
          scope.deleteCache(mockReturn, null);
          mock.verify();
          mockReturn.deleted.should.be.equal(true);
          done();
        }
      });
      $httpBackend.flush();
  });
});
