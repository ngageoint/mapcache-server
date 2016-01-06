var assert = require('assert')
  , FeatureModel = require('mapcache-models').Feature
  , turf = require('turf')
  , lengthStream = require('length-stream')
  , log = require('mapcache-log')
  , devnull = require('dev-null')
  , should = require('should');

var geojsonDataSource = {
  id: 'test-ds',
  name: 'counties',
  file: {
    path:__dirname + '/counties.geojson',
    name: 'counties.geojson'
  },
  format: 'geojson',
  zOrder: 0
};

var pointDataSource = {
  id: 'test-point',
  name: 'point',
  file: {
    path: __dirname + '/point.json',
    name: 'point.json'
  },
  format: 'geojson',
  zOrder: 1
};

var map = {
  id: 'test-map',
  dataSources: []
};

var cache = {
  id: 'test-cache',
  name: 'geojson test cache',
  geometry: turf.polygon([[
    [-180, -85],
    [-180, 85],
    [180, 85],
    [180, -85],
    [-180, -85]
  ]]),
  minZoom: 0,
  maxZoom: 2,
  formats: ['xyz']
};

var GeoJSON = require('../../format/geojson');

describe('geojson', function() {
  describe('#constructor', function () {
    it('should construct an geojson with a source', function () {
      var geojson = new GeoJSON({source: {id: '5'}});
      geojson.source.id.should.equal('5');
    });
    it('should construct an geojson with a cache', function() {
      var geojson = new GeoJSON({cache: {id: '6'}, outputDirectory: '/tmp'});
      console.log('geojson ', geojson.cache.id);
      geojson.cache.id.should.equal('6');
    });
  });

  describe('geojson source tests', function() {
    var geojson;
    before(function(done) {
      geojson = new GeoJSON({
        source: pointDataSource,
        outputDirectory: '/tmp'
      });
      FeatureModel.deleteFeaturesBySourceId(geojson.source.id, function(err) {
        console.log('err is', err);
        done();
      });
    });
    after(function(done) {
      FeatureModel.deleteFeaturesBySourceId(geojson.source.id, function(err) {
        log.info('Deleted %d features from the source %s', err, geojson.source.id);
        done();
      });
    });
    it('should process the source', function(done) {
      this.timeout(0);
      geojson.processSource(function(err, newSource) {
        if(err) {
          return done(err);
        }
        console.log('after the source has been processed', newSource);
        log.info('XXXXXXXXXXX ----------------------', geojson.source);
        map.dataSources.push(newSource);
        newSource.status.message.should.equal("Complete");
        FeatureModel.getAllSourceFeatures(geojson.source.id, function(err, features) {
          log.info('features', features);
          done();
        });
      }, function(source, callback) {
        console.log('progress', source);
        callback(null, source);
      });
    });
    it('should pull the 0/0/0 tile for the data source', function(done) {
      this.timeout(0);
      geojson.getTile('png', 0, 0, 0, {noCache: true}, function(err, stream) {
        if (err) {
          done(err);
          return;
        }

        var lstream = lengthStream(function(length) {
          console.log('tile size is ', length);
          length.should.be.greaterThan(0);
          done();
        });
        stream.pipe(lstream).pipe(devnull());
      });
    });
    it('should pull the 0/0/0 geojson tile for the data source', function(done) {
      this.timeout(0);
      geojson.getTile('geojson', 0, 0, 0, {noCache: true}, function(err, stream) {
        if (err) {
          done(err);
          return;
        }

        var lstream = lengthStream(function(length) {
          console.log('tile size is ', length);
          length.should.be.greaterThan(0);
          done();
        });
        stream.pipe(lstream).pipe(devnull());
      });
    });
    it('should get all features of the source', function(done) {
      this.timeout(0);
      geojson.getDataWithin(-179, -85, 179, 85, 4326, function(err, features) {
        console.log('err', err);
        if (err) {
          done(err);
          return;
        }

        log.info("Get All Features feature count", features);
        features.length.should.be.equal(1);
        done();
      });
    });
    describe('geojson cache tests', function() {
      var geoJson;
      before(function(done) {
        cache.source = map;
        geoJson = new GeoJSON({
          cache: cache,
          outputDirectory: '/tmp'
        });
        FeatureModel.deleteFeaturesByCacheId(geoJson.cache.id, function(count) {
          console.log('deleted %d features before test', count);
          done();
        });
      });
      after(function(done) {
        FeatureModel.deleteFeaturesByCacheId(geoJson.cache.id, function(count) {
          console.log('deleted %d features', count);
          done();
        });
      });
      it('should pull the 0/0/0 tile for the cache', function(done) {
        geoJson.getTile('png', 0, 0, 0, {noCache: true}, function(err, stream) {
          if (err) {
            done(err);
            return;
          }

          var lstream = lengthStream(function(length) {
            length.should.be.greaterThan(0);
            done();
          });
          stream.pipe(lstream).pipe(devnull());

        });
      });
      it('should pull the 0/0/0 geojson tile for the cache', function(done) {
        this.timeout(0);
        geoJson.getTile('geojson', 0, 0, 0, {noCache: true, projection: 4326}, function(err, stream) {
          //console.log('stream came back', stream);
          if (err) {
            done(err);
            return;
          }
          var geojsonString = '';
          stream.on('data', function(data) {
            console.log('stream data event');
            geojsonString += data;
          });
          stream.on('end', function(){
            console.log('stream end event', geojsonString);
            var parsed = JSON.parse(geojsonString);
            geojsonString.should.be.equal('{"type":"FeatureCollection","features":[{"geometry":{"type":"Point","coordinates":[-105.01621,39.57422]},"properties":{}}]}');
            should.exist(parsed);
            done();
          });
          stream.on('error', function(err){
            console.log('stream error', err);
          });
          stream.on('close', function() {
            console.log('stream close');
          });
          stream.pipe(devnull());
        });
      });
      it('should generate the cache', function(done) {
        geoJson.generateCache(function(err, cache, features) {
          done();
        });
      });
      it('should pull features for the cache', function(done) {
        geoJson.getDataWithin(-180, -85, 180, 85, 4326, function(err, features) {
          if (err) {
            done(err);
            return;
          }
          features.length.should.equal(1);
          done();
        });
      });
    });
  });
});
