
describe('StorageController', function() {

  var scope;
  var ctrl;
  var CacheServiceMock;
  var $httpBackend;

  beforeEach(module('mapcache'));

  // beforeEach(function() {
  //   CacheServiceMock = {
  //       getAllCaches: function() {
  //         return {
  //           success: function() {
  //             return [{
  //               name: 'nuts'
  //             }];
  //           }
  //         };
  //       }
  //   };
  //   module(function($provide) {
  //     $provide.value('CacheService', CacheServiceMock);
  //   });
  // });

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

    $httpBackend.when('GET', '/api/caches').respond([{
      woo: 'oop'
    }]);

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
