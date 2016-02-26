
var angular = require('angular')
  , should = require('chai').should()
  , mocks = require('../mocks')
  , angularMocks = require('angular-mocks');

describe('user filter tests', function() {
  var $filter;

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_$filter_){
    $filter = _$filter_;
  }));

  it('should filter on username', function() {
    var output = $filter('user')(mocks.userMocks.users, ['username'], 'i');
    output.length.should.be.equal(1);
    output[0].should.be.deep.equal(mocks.userMocks.adminUser);
  });

  it('should return the collection', function() {
    var output = $filter('user')(mocks.userMocks.users, ['username']);
    output.length.should.be.equal(mocks.userMocks.users.length);
  });

  it('should return the collection as an array if it wasnt', function() {
    var output = $filter('user')(mocks.userMocks.adminUser, ['username'], 'i');
    output.length.should.be.equal(1);
    output[0].should.be.deep.equal(mocks.userMocks.adminUser);
  });

  it('should return null', function() {
    var output = $filter('user')(null, ['username'], 'i');
    should.not.exist(output);
  });

});
