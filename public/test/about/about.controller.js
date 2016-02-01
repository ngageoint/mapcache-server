describe('AboutController', function() {

  var scope;
  var ctrl;

  beforeEach(module('userManagement'));

  beforeEach(inject(function($rootScope, $controller) {
    scope = $rootScope.$new();
    ctrl = $controller('AboutController', {$scope: scope});
  }));

  it('should create the AboutController', function() {
    should.exist(ctrl);
    scope.about.should.be.equal('About');
  });
});
