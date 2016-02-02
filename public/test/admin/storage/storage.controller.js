
var angular = require('angular');
require('angular-mocks');

var sinon  = require('sinon');
var sinonAsPromised = require('sinon-as-promised');

describe('StorageController', function() {

  var scope;
  var ctrl;
  var CacheServiceMock = {};
  var $httpBackend;

  before(function() {
    angular.module('mapcache', [  ]);

    require('../../../app/admin/storage');
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(function() {
    angular.mock.module(function($provide) {
      $provide.value('CacheService', CacheServiceMock);
    });
  });

  beforeEach(angular.mock.inject(function ($q) {
    sinonAsPromised($q);
  }));

  beforeEach(function() {
    CacheServiceMock.getAllCaches = sinon.stub().resolves([{
      name: 'Test Cache'
    }]);
  });

  beforeEach(inject(function($rootScope, $controller, $injector){

    $httpBackend = $injector.get('$httpBackend');
    $httpBackend.when('GET', '/api/server').respond({
      woo: 'oop'
    });
    $httpBackend.when('GET', '/api/maps').respond({
      woo: 'oop'
    });
    $httpBackend.when('GET', '/api/roles').respond({
      woo: 'oop'
    });
    $httpBackend.when('GET', '/api/users').respond({
      woo: 'oop'
    });

    // $httpBackend.when('GET', '/api/caches').respond([{
    //   woo: 'oop'
    // }]);

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
        done();
      }
    });
    scope.$apply();

    var caches = scope.caches;

    console.log('caches', caches);
    var name = scope.formatName('xyz');
    console.log('name', name);
    name.should.be.equal('XYZ');
    $httpBackend.flush();
  });
});
