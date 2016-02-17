
var angular = require('angular')
  , angularMocks = require('angular-mocks');

describe('paging offset filter tests', function() {
  var $filter;

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_$filter_){
    $filter = _$filter_;
  }));

  it('should return 3 through 14', function() {
    var output = $filter('offset')([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 2);
    output.length.should.be.equal(12);
    output[0].should.be.equal(3);
    output[output.length-1].should.be.equal(14);
  });

  it('should return 3 through 12', function() {
    var output = $filter('offset')([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 2, 10);
    output.length.should.be.equal(10);
    output[0].should.be.equal(3);
    output[output.length-1].should.be.equal(12);
  });

});
