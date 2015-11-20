var turf = require('turf')
  , fs = require('fs')
  , async = require('async')
  , FeatureModel = require('mapcache-models').Feature
  , GeoJSON = require('../../format/geojson')
  , XYZ = require('../../format/xyz')
  , Map = require('../../map/map')
  , Cache = require('../../cache/cache');

var cacheModel = {
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

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function toHex(d) {
    return  ("0"+(Number(d).toString(16))).slice(-2).toUpperCase()
}

function getRandomColor() {
  return '#' + toHex(getRandomInt(0, 256)) + toHex(getRandomInt(0, 256)) + toHex(getRandomInt(0, 256));
}

describe('vectortests', function() {
  var osm;
  var land;
  var rivers;
  var map;

  before(function(done) {
    osm = {
      id: 'osm-ds',
      name: 'osm',
      url: 'http://osm.geointapps.org/osm',
      format: 'xyz',
      zOrder: 0
    };
    land = {
      id: 'land-ds',
      name: 'land',
      file: {
        path:__dirname + '/Land.geojson',
        name: 'Land.geojson'
      },
      format: 'geojson',
      zOrder: 1,
      style: {
        defaultStyle: {
          style: {
            'fill': getRandomColor(),
            'fill-opacity': 0.5,
            'stroke': getRandomColor(),
            'stroke-opacity': 1.0,
            'stroke-width': 1
          }
        }
      }
    };

    rivers = {
      id: 'rivers-ds',
      name: 'rivers',
      file: {
        path:__dirname + '/Rivers.geojson',
        name: 'Rivers.geojson'
      },
      format: 'geojson',
      zOrder: 2,
      style: {
        defaultStyle: {
          style: {
            'fill': getRandomColor(),
            'fill-opacity': 0.5,
            'stroke': getRandomColor(),
            'stroke-opacity': 1.0,
            'stroke-width': 1
          }
        }
      }
    }; 
    map = new Map({
     outputDirectory: '/tmp',
     id: 'test-map',
     name: 'test-map',
     dataSources: [osm, land, rivers]
   });

    FeatureModel.deleteFeaturesBySourceId(land.id, function(count) {
      console.log('deleted %d land features', count);
      FeatureModel.deleteFeaturesBySourceId(rivers.id, function(count) {
        console.log('deleted %d river features', count);
        done();
      });
    });
  });
  after(function(done) {
    FeatureModel.deleteFeaturesBySourceId(land.id, function(count) {
      console.log('deleted %d land features', count);
      FeatureModel.deleteFeaturesBySourceId(rivers.id, function(count) {
        console.log('deleted %d river features', count);
        done();
      });
    });
  });

  it('should pull a tile from the map', function (done) {
    this.timeout(0);

    map.getTile('png', 0, 0, 0, {noCache: true}, function(err, stream) {
      if (err) {
        done(err);
        return;
      }

      var ws = fs.createWriteStream('/tmp/vector_test.png');
      stream.pipe(ws);
      stream.on('end', function() {
        done();
      });

    });
  });

  it('should construct a cache and pull the tile', function (done) {
    this.timeout(0);

    cacheModel.source = map;
    cacheModel.outputDirectory = '/tmp';

    var cache = new Cache(cacheModel);

    cache.getTile('png', 0, 0, 0, {noCache: true}, function(err, stream) {
      if (err) {
        done(err);
        return;
      }

      var ws = fs.createWriteStream('/tmp/vector_cache_test.png');
      stream.pipe(ws);
      stream.on('end', function() {
        done();
      });

    });
  });

  it('should construct a cache and pull the tile with no rivers', function (done) {
    this.timeout(0);

    cacheModel.source = map;
    cacheModel.outputDirectory = '/tmp';
    cacheModel.cacheCreationParams = {
      dataSources: ['osm-ds', 'land-ds']
    };

    var cache = new Cache(cacheModel);

    cache.getTile('png', 0, 0, 0, {noCache: true}, function(err, stream) {
      if (err) {
        done(err);
        return;
      }

      var ws = fs.createWriteStream('/tmp/vector_cache_no_rivers_test.png');
      stream.pipe(ws);
      stream.on('end', function() {
        done();
      });

    });
  });

});
