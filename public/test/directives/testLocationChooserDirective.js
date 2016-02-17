
var angular = require('angular')
  , $ = require('jquery')
  , sinon  = require('sinon')
  , angularMocks = require('angular-mocks');

describe('location chooser directive tests', function() {
  var $compile,
      $scope,
      $rootScope,
      sandbox;

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  beforeEach(inject(function(_$compile_, _$rootScope_){
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $scope = _$rootScope_.$new();
  }));

  it('should set the location url', function(done) {
    var mock = sandbox.mock($scope).expects('$emit').withArgs('location-url').once();
    $scope.$on('location-url', function(event, location, valid) {
      location.should.be.equal('http://osm.geointapps.org/osm');
      valid.should.be.equal(true);
      done();
    });

    $scope.locationStatus = {};
    $scope.file = {};

    var element = $compile('<div location-chooser location-status="locationStatus" file="file"></div>')($scope);
    $scope.$digest();
    element.html().should.not.be.equal('<div location-chooser location-status="locationStatus" file="file"></div>');
    var input = $(element).find('input[type=text]');
    input.val('http://osm.geointapps.org/osm').trigger('input');
    mock.verify();
  });

  it('should set an invalid location url', function(done) {

    var mock = sandbox.mock($scope).expects('$emit').never();

    $scope.locationStatus = {};
    $scope.file = {};

    var element = $compile('<div location-chooser location-status="locationStatus" file="file"></div>')($scope);
    $scope.$digest();
    element.html().should.not.be.equal('<div location-chooser location-status="locationStatus" file="file"></div>');
    var input = $(element).find('input[type=text]');
    input.val('asfdhttp://osm.geointapps.org/osm').trigger('input');

    mock.verify();
    done();
  });

  it('should choose a file', function(done) {
    var fakeFile = {
      name: 'test.geojson',
      size: 50
    };

    var mock = sandbox.mock($scope).expects('$emit').withArgs('location-file').once();

    $scope.$on('location-file', function(event, location) {
      location.should.be.deep.equal(fakeFile);
      done();
    });

    $scope.locationStatus = {};
    $scope.file = {};

    var element = $compile('<div location-chooser location-status="locationStatus" file="file"></div>')($scope);
    $scope.$digest();
    element.html().should.not.be.equal('<div location-chooser location-status="locationStatus" file="file"></div>');

    var fileToUpload = '/tmp/some/path/foo.txt';
      // absolutePath = path.resolve(__dirname, fileToUpload);

    var fileInput = $(element).find('input[type="file"]');
    fileInput.triggerHandler({
      type: 'change',
      target: {
        files: [fakeFile]
      }
    });
    mock.verify();
    done();
  });

});
