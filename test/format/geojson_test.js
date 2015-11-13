var assert = require('assert')
  , FeatureModel = require('mapcache-models').Feature
  , turf = require('turf')
  , lengthStream = require('length-stream')
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
  dataSources: [pointDataSource]
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
  formats: ['xyz'],
  source: map
};

var GeoJSON = require('../../format/geojson');

describe('geojson', function() {
  describe('#constructor', function () {
    it('should construct an geojson with a source', function () {
      var geojson = new GeoJSON({source: {id: '5'}});
      geojson.source.id.should.equal('5');
    });
    it('should construct an geojson with a cache', function() {
      var geojson = new GeoJSON({cache: {id: '6'}});
      geojson.cache.id.should.equal('6');
    });
    it ('should test turf', function() {
      var poly1 = {
        "type": "Feature",
        "properties": {
          "fill": "#0f0"
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-170,-80],[170,-80],[170,80],[-170,80],[-170,-80]
            /*[-122.801742, 45.48565],
            [-122.801742, 45.60491],
            [-122.584762, 45.60491],
            [-122.584762, 45.48565],
            [-122.801742, 45.48565]*/
          ]]
        }
      };
      var poly2 = {
        "type": "Feature",
        "properties": {
          "fill": "#00f"
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
// [-105.01621,39.57422],[-104.01621,39.57422],[-104.01621,39.57422],[-105.01621,39.57422],[-105.01621,39.57422]

            [-105.01621,39.57422],
            [-122.64038, 45.553967],
            [-122.720031, 45.526554],
            [-122.669906, 45.507309],
            [-122.723464, 45.446643],
            [-122.532577, 45.408574],
            [-122.487258, 45.477466],
            [-105.01621,39.57422]

/*
            [-122.520217, 45.535693],
            [-122.64038, 45.553967],
            [-122.720031, 45.526554],
            [-122.669906, 45.507309],
            [-122.723464, 45.446643],
            [-122.532577, 45.408574],
            [-122.487258, 45.477466],
            [-122.520217, 45.535693]
            */
          ]]
        }
      };

      var intersection = turf.intersect(poly1, poly2);
      console.log('intersection', JSON.stringify(intersection));


      var feature = {"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-105.01621,39.57422],[-104.01621,39.57422],[-104.01621,39.57422],[-105.01621,39.57422],[-105.01621,39.57422]]]},"properties":{}};
      var bufferedBox = { west: -170, south: -80, east: 170, north: 80 };

      var bboxPoly = turf.bboxPolygon([bufferedBox.west, bufferedBox.south, bufferedBox.east, bufferedBox.north]);

      console.log('bboxPoly', JSON.stringify(bboxPoly));
      var intersect = turf.intersect(bboxPoly, feature);

      console.log('intersect', intersect);
    });
  });

  describe('geojson source tests', function() {
    var geojson;
    before(function(done) {
      geojson = new GeoJSON({
        source: pointDataSource
      });
      FeatureModel.deleteFeaturesBySourceId(geojson.source.id, function(err) {
        console.log('err is', err);
        done();
      });
    });
    after(function(done) {
      FeatureModel.deleteFeaturesBySourceId(geojson.source.id, function(err) {
        console.log('err is', err);
        done();
      });
    });
    it('should process the source', function(done) {
      this.timeout(0);
      geojson.processSource(function(err, newSource) {
        if(err) {
          return done(err);
        }
        console.log('source', newSource);
        newSource.status.message.should.equal("Complete");
        FeatureModel.getAllSourceFeatures(geojson.source.id, function(err, features) {
          console.log('features', features);
          done();
        });
      }, function(source, callback) {
        console.log('progress', source);
        callback(null, source);
      });
    });
    xit('should pull the 0/0/0 tile for the data source', function(done) {
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
    xit('should pull the 0/0/0 geojson tile for the data source', function(done) {
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
    describe('geojson cache tests', function() {
      var geoJson;
      before(function() {
        geoJson = new GeoJSON({
          cache: cache
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
        geoJson.getTile('geojson', 0, 0, 0, {noCache: true}, function(err, stream) {
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
            // parsed.should.exist();
            // console.log('string is', geojsonString);
            done();
          });
          stream.on('error', function(err){
            console.log('stream error', err);
          });
          stream.on('close', function() {
            console.log('stream close');
          });
          stream.pipe(devnull());
          // stream.pipe(lstream).pipe(devnull());

        });
      });
    });
  });
});
