
var angular = require('angular')
  , should = require('chai').should()
  , moment = require('moment')
  , angularMocks = require('angular-mocks');

describe('moment filter tests', function() {
  var $filter;

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_$filter_){
    $filter = _$filter_;
  }));

  it('should return the time from now', function() {
    var output = $filter('moment')('2015-02-02', 'fromNow');
    output.should.be.equal(moment('2015-02-02').fromNow());
  });

  it('should return the formatted time', function() {
    var output = $filter('moment')('2015-02-02', 'YYYY');
    output.should.be.equal(moment('2015-02-02').format('YYYY'));
  });

  it('should return the input', function() {
    var output = $filter('moment')('2015-02-02');
    output.should.be.equal('2015-02-02');
  });

  it('should return null', function() {
    var output = $filter('moment')();
    should.not.exist(output);
  });

});
