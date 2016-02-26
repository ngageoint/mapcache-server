
var angular = require('angular')
  , should = require('chai').should()
  , angularMocks = require('angular-mocks');

describe('cache format filter tests', function() {
  var $filter;

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_$filter_){
    $filter = _$filter_;
  }));

  it('should return the cache format', function() {
    var format = $filter('cacheFormat')('xyz');
    format.should.be.equal('XYZ');
  });

  it('should return null', function() {
    var format = $filter('cacheFormat')();
    should.not.exist(format);
  });

});
