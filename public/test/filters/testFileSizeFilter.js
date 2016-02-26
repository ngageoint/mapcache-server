
var angular = require('angular')
  , should = require('chai').should()
  , angularMocks = require('angular-mocks');

describe('file size filter tests', function() {
  var $filter;

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_$filter_){
    $filter = _$filter_;
  }));

  it('should return the file size bytes', function() {
    var fileSize = $filter('fileSize')(2);
    fileSize.should.be.equal('2.000 bytes');
  });

  it('should return the file size kB', function() {
    var fileSize = $filter('fileSize')(2*1024);
    fileSize.should.be.equal('2.000 kB');
  });

  it('should return the file size MB', function() {
    var fileSize = $filter('fileSize')(2*1024*1024);
    fileSize.should.be.equal('2.000 MB');
  });

  it('should return the file size GB', function() {
    var fileSize = $filter('fileSize')(2*1024*1024*1024);
    fileSize.should.be.equal('2.000 GB');
  });

  it('should return the file size TB', function() {
    var fileSize = $filter('fileSize')(2*1024*1024*1024*1024);
    fileSize.should.be.equal('2.000 TB');
  });

  it('should return the file size PB', function() {
    var fileSize = $filter('fileSize')(2*1024*1024*1024*1024*1024);
    fileSize.should.be.equal('2.000 PB');
  });

  it('should return null', function() {
    var fileSize = $filter('fileSize')('not a number');
    should.not.exist(fileSize);
  });

  it('should return null', function() {
    var fileSize = $filter('fileSize')();
    should.not.exist(fileSize);
  });

});
