var assert = require('assert')
  , FeatureModel = require('mapcache-models').Feature
  , turf = require('turf')
  , lengthStream = require('length-stream')
  , devnull = require('dev-null')
  , fs = require('fs')
  , should = require('should');

var failDataSource = {
  id: 'test-ds',
  name: 'mrsid',
  format: 'mrsid',
  file: {
    path: __dirname + '/oregon_nogeoinfo.sid',
    name: 'oregon.sid'
  },
  zOrder: 0
};

var successDataSource = {
  id: 'test-ds',
  name: 'mrsid',
  format: 'mrsid',
  file: {
    path: __dirname + '/toronto.sid',
    name: 'toronto.sid'
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

var MrSID = require('../../format/mrsid');

var tmpImage = '/tmp/mrsid_test.png';

describe('MrSID', function() {
  describe('#constructor', function () {
    it('should construct an MrSID with a source', function () {
      var mrsid = new MrSID({source: {id: '5'}});
      mrsid.source.id.should.equal('5');
    });
    it('should throw an error since MrSID caches are not supported', function() {
      try {
        new MrSID({cache: {id: '6'}}).should.throw(Error);
      } catch (e) {
        console.log('threw error', e);
      }
    });
  });

  describe('MrSID source tests', function() {
    var mrisd;
    before(function() {
      mrsid = new MrSID({
        source: successDataSource
      });
    });
    after(function() {
    });
    it('should process the source', function(done) {
      mrsid.processSource(function(err, newSource) {
        if(err) {
          return done(err);
        }
        var geom = {
          type:"Feature",
          geometry: {
            type:"Polygon",
            coordinates:[[
              [ -79.38254249991722, 43.67320449320221 ],
              [ -79.30881449983531, 43.67320449320221 ],
              [ -79.30881449983531, 43.599476493218596 ],
              [ -79.38254249991722, 43.599476493218596 ],
              [ -79.38254249991722, 43.67320449320221 ]
            ]]
          },
          "properties":{
          }
        };
        console.log('newSource', newSource);
        newSource.geometry.geometry.coordinates.should.containDeep(geom.geometry.coordinates);
        newSource.projection.should.be.equal('4326');
        should.exist(newSource.scaledFiles);
        map.dataSources.push(newSource);
        done();
      }, function(source, callback) {
        console.log('progress', source);
        callback(null, source);
      });
    });
    xit('should not pull the 13/1710/3111 tile for the data source because no data exists there', function(done) {
      this.timeout(0);
      mrsid.getTile('png', 13, 1710, 3111, {noCache: true}, function(err, stream) {
        if (err) {
          done(err);
          return;
        }
        should.not.exist(stream);
        done();
      });
    });
    xit('should pull the 11/572/747 tile for the data source', function(done) {
      this.timeout(0);
      mrsid.getTile('png', 11, 572, 747, {noCache: true}, function(err, stream) {
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
            expectedImage: __dirname + '/mrsidtile.png',
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
      mrsid.getDataWithin(-180, -85, 180, 85, 4326, function(err, features) {
        console.log('err', err);
        if (err) {
          done(err);
          return;
        }
        should.not.exist(features);
        done();
      });
    });
    it ('should fail to process this source', function(done) {
      var fail = new MrSID({
        source: failDataSource
      });
      fail.processSource(function(err, newSource) {
        if(err) {
          return done(err);
        }
        newSource.status.failure.should.be.true();
        done();
      });
    })
  });
});
