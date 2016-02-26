
var angular = require('angular')
  , should = require('chai').should()
  , mocks = require('../mocks')
  , angularMocks = require('angular-mocks');

describe('turf filter tests', function() {
  var $filter;

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_$filter_){
    $filter = _$filter_;
  }));

  it('should return west', function() {
    var output = $filter('turf')({
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              180,
              -85
            ],
            [
              -180,
              -85
            ],
            [
              -180,
              85
            ],
            [
              180,
              85
            ],
            [
              180,
              -85
            ]
          ]
        ]
      }
    }, 'extent', 'w');
    output.should.be.equal(-180);
  });

  it('should return south', function() {
    var output = $filter('turf')({
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              180,
              -85
            ],
            [
              -180,
              -85
            ],
            [
              -180,
              85
            ],
            [
              180,
              85
            ],
            [
              180,
              -85
            ]
          ]
        ]
      }
    }, 'extent', 's');
    output.should.be.equal(-85);
  });

  it('should return east', function() {
    var output = $filter('turf')({
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              180,
              -85
            ],
            [
              -180,
              -85
            ],
            [
              -180,
              85
            ],
            [
              180,
              85
            ],
            [
              180,
              -85
            ]
          ]
        ]
      }
    }, 'extent', 'e');
    output.should.be.equal(180);
  });

  it('should return north', function() {
    var output = $filter('turf')({
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              180,
              -85
            ],
            [
              -180,
              -85
            ],
            [
              -180,
              85
            ],
            [
              180,
              85
            ],
            [
              180,
              -85
            ]
          ]
        ]
      }
    }, 'extent', 'n');
    output.should.be.equal(85);
  });

  it('should return null', function() {
    var output = $filter('turf')({
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              180,
              -85
            ],
            [
              -180,
              -85
            ],
            [
              -180,
              85
            ],
            [
              180,
              85
            ],
            [
              180,
              -85
            ]
          ]
        ]
      }
    }, 'extent');
    should.not.exist(output);
  });

  it('should return the input', function() {
    var output = $filter('turf')('input');
    output.should.be.equal('input');
  });

  it('should return null', function() {
    var output = $filter('turf')(null);
    should.not.exist(output);
  });

});
