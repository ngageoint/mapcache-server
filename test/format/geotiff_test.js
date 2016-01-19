var assert = require('assert')
  , FeatureModel = require('mapcache-models').Feature
  , turf = require('turf')
  , lengthStream = require('length-stream')
  , fs = require('fs')
  , should = require('should');

var geotiffDataSource = {
  id: 'test-ds',
  name: 'geotiff',
  format: 'geotiff',
  file: {
    path: __dirname + '/denver.tif',
    name: 'geotiff'
  },
  zOrder: 0
};

var map = {
  id: 'test-map',
  dataSources: []
};

/* Bounds of denver.tif *
/*
Upper Left  (  512651.296, 4391240.166) (104d51' 8.98"W, 39d40'15.19"N) (-104.852494, 39.670886)
Lower Left  (  512651.296, 4388316.166) (104d51' 9.18"W, 39d38'40.34"N) (-104.85255, 39.644539)
Upper Right (  515154.296, 4391240.166) (104d49'23.92"W, 39d40'15.04"N) (-104.823311, 39.670844)
Lower Right (  515154.296, 4388316.166) (104d49'24.16"W, 39d38'40.20"N) (-104.823378, 39.6445)
Center      (  513902.796, 4389778.166) (104d50'16.56"W, 39d39'27.69"N)
*/

var cache = {
  id: 'test-cache',
  name: 'generic test cache',
  geometry: turf.polygon([[
    [-104.86, 39.6],
    [-104.86, 39.7],
    [-104.81, 39.7],
    [-104.81, 39.6],
    [-104.86, 39.6]
  ]]),
  minZoom: 0,
  maxZoom: 12,
  formats: ['xyz']
};

var GeoTIFF = require('../../format/geotiff');

var tmpImage = '/tmp/geotiff_test.png';

describe('geotiff', function() {
  describe('#constructor', function () {
    it('should construct an geotiff with a source', function () {
      var geotiff = new GeoTIFF({source: {id: '5'}});
      geotiff.source.id.should.equal('5');
    });
    it('should throw an error since geotiff caches are not supported', function() {
      try {
        new GeoTIFF({cache: {id: '6'}}).should.throw(Error);
      } catch (e) {
        console.log('threw error', e);
      }
    });
  });

  describe('geotiff source tests', function() {
    var geotiff;
    before(function() {
      geotiff = new GeoTIFF({
        source: geotiffDataSource
      });
      // var stat = fs.statSync(__dirname + '/test_geotiff_out.png');
      // console.log('stat', stat);
      // if (stat.isFile()) {
      //   fs.unlinkSync(__dirname + '/test_geotiff_out.png');
      // }
    });
    after(function() {
    });
    it('should process the source', function(done) {
      geotiff.processSource(function(err, newSource) {
        if(err) {
          return done(err);
        }
        var geom = {
          type:"Feature",
          geometry: {
            type:"Polygon",
            coordinates:[[
              [-104.85249416245563,39.67088552045151],
              [-104.82331093941556,39.67084478892132],
              [-104.82337800954186,39.64449869141027],
              [-104.85255015490993,39.64453938508538],
              [-104.85249416245563,39.67088552045151]
            ]]
          },
          "properties":{
          }
        };
        newSource.geometry.geometry.coordinates.should.containDeep(geom.geometry.coordinates);
        newSource.projection.should.be.equal('26913');
        should.exist(newSource.scaledFiles);
        map.dataSources.push(newSource);
        done();
      }, function(source, callback) {
        console.log('progress', source);
        callback(null, source);
      });
    });
    it('should pull the 13/1710/3111 tile for the data source', function(done) {
      this.timeout(0);
      geotiff.getTile('png', 13, 1710, 3111, {noCache: true}, function(err, stream) {
        if (err) {
          done(err);
          return;
        }
        should.exist(stream);
        var ws = fs.createWriteStream(tmpImage);
        stream.pipe(ws);
        stream.on('end', function() {

          var imageDiff = require('image-diff');
          imageDiff({
            actualImage: tmpImage,
            expectedImage: __dirname + '/geotifftile.png',
            diffImage: '/tmp/difference.png',
          }, function (err, imagesAreSame) {
            should.not.exist(err);
            imagesAreSame.should.be.true();
            done();
          });
        });
      });
    });
    it('should get all features of the source', function(done) {
      this.timeout(0);
      geotiff.getDataWithin(-180, -85, 180, 85, 4326, function(err, features) {
        console.log('err', err);
        if (err) {
          done(err);
          return;
        }
        should.not.exist(features);
        done();
      });
    });
  });
});
