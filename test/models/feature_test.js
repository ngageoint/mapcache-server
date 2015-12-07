var log = require('mapcache-log')
  , FeatureModel = require('mapcache-models').Feature
  , turf = require('turf')
  , async = require('async')
  , should = require('should');

describe('Feature Model Tests', function() {

  var box1 = {
    "type": "Feature",
    "properties": {
      "state":"Colorado",
      "year": 1876
    },
    "geometry": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            9.4921875,
            16.972741019999035
          ],
          [
            9.4921875,
            25.165173368663954
          ],
          [
            20.390625,
            25.165173368663954
          ],
          [
            20.390625,
            16.972741019999035
          ],
          [
            9.4921875,
            16.972741019999035
          ]
        ]
      ]
    }
  };

  var box2 = {
    "type": "Feature",
    "properties": {
      "state":"California"
    },
    "geometry": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            15,
            20
          ],
          [
            15,
            31
          ],
          [
            32,
            31
          ],
          [
            32,
            20
          ],
          [
            15,
            20
          ]
        ]
      ]
    }
  };

  before(function(done) {
    this.timeout(0);
    FeatureModel.deleteFeaturesBySourceId('featuretest', function(count) {
      log.info('deleted %d %s features', count, 'featuretest');
      FeatureModel.deleteFeaturesByCacheId('featuretestcache', function(count) {
        log.info('deleted %d %s features', count, 'featuretestcache');

        async.eachSeries([box1, box2], function(feature, callback) {
          FeatureModel.createFeatureForSource(feature, 'featuretest', function(collection) {
            callback();
          });
        }, function() {
          async.eachSeries([box1, box2], function(feature, callback) {
            FeatureModel.createFeatureForCache(feature, 'featuretestcache', 'featuretest', function(collection) {
              callback();
            });
          }, function() {
            done();
          });
        });
      });
    });
  });

  after(function(done) {
    this.timeout(0);
    FeatureModel.deleteFeaturesBySourceId('featuretest', function(count) {
      log.info('deleted %d %s features', count, 'featuretest');
      FeatureModel.deleteFeaturesByCacheId('featuretestcache', function(count) {
        log.info('deleted %d %s features', count, 'featuretestcache');
        done();
      });
    });
  });

  it('should count the features in the feature set', function (done) {
    FeatureModel.getFeatureCountBySource('featuretest', function(collection) {
      collection[0].count.should.be.equal('2');
      done();
    })
  });

  it('should get the extent of the feature set', function (done) {
    FeatureModel.getExtentOfSource('rivers-ds', function(collection) {
      console.log('collection', collection);
      collection[0].extent.should.be.equal('{"type":"Polygon","coordinates":[[[9.49218750000001,16.972741019999],[9.49218750000001,31],[32,31],[32,16.972741019999],[9.49218750000001,16.972741019999]]]}');
      done();
    })
  });

  it('should get the properties of the feature set', function (done) {
    FeatureModel.getPropertyKeysFromSource('rivers-ds', function(collection) {
      console.log('collection', collection);
      // collection[0].property.should.be.equal('state');
      // collection[1].property.should.be.equal('year');
      done();
    })
  });

  it('should get the values of the feature set', function (done) {
    FeatureModel.getValuesForKeyFromSource('Name','rivers-ds', function(collection) {
      console.log('collection values', collection);
      collection[0].value.should.be.equal('California');
      collection[1].value.should.be.equal('Colorado');
      done();
    })
  });

});
