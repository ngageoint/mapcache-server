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
  maxZoom: 4,
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

function getRandomStyle() {
  return {
    'fill': getRandomColor(),
    'fill-opacity': 0.5,
    'stroke': getRandomColor(),
    'stroke-opacity': 0.5,
    'stroke-width': 1
  }
}

describe('vectortests', function() {
  var osm;
  var land;
  var rivers;
  var map;

  before(function(done) {
    this.timeout(0);



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
          style: getRandomStyle()
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
          style: getRandomStyle()
        }
      }
    };

    seaHexes = {
      id: 'seahexes-ds',
      name: 'seahexes',
      file: {
        path: '/data/maps/seahexes.json',
        name: 'seahexes'
      },
      format: 'geojson',
      zOrder: 1,
      style: {
        defaultStyle: {
          style: getRandomStyle()
        }
      }
    };

    landHexes = {
      id: 'landhexes-ds',
      name: 'landhexes',
      file: {
        path: '/data/maps/landhexes.json',
        name: 'landhexes'
      },
      format: 'geojson',
      zOrder: 1,
      style: {
        defaultStyle: {
          style: getRandomStyle()
        }
      }
    };

    async.eachSeries([rivers, land]/*, seaHexes, landHexes]*/, function(source, callback) {
      FeatureModel.deleteFeaturesBySourceId(source.id, function(count) {
        console.log('deleted %d %s features', count, source.id);
        callback();
      });
    }, function() {
      // map = new Map({
      //   outputDirectory: '/tmp',
      //   id: 'test-map',
      //   name: 'test-map',
      //   dataSources: [osm, land, rivers]
      // });
      // map.callbackWhenInitialized(function() {
      //   console.log('map initialized');
      //   done();
      // });


      // var mapString = JSON.stringify(hexMap, null, 2);
      // var ws = fs.createWriteStream('/tmp/hexmap.json');
      // var Readable = require('stream').Readable;
      // s = new Readable();
      // s.push(mapString);
      // s.push(null);
      //
      // s.pipe(ws);


      var stream = fs.createReadStream('/tmp/hexmap.json');
      console.log('reading in the file', '/tmp/hexmap.json');
      fs.readFile('/tmp/hexmap.json', function(err, fileData) {
        console.log('parsing file data', '/tmp/hexmap.json');
        console.time('parsing geojson');
        var gjData = JSON.parse(fileData);
        console.log('datasources', JSON.stringify(gjData.map.dataSources, null, 2));
        var datasources = [];
        for (var i = 0; i < gjData.map.dataSources.length; i++) {
          var s = gjData.map.dataSources[i].source;
          if (s.style) {
            s.style.defaultStyle.style = getRandomStyle();
          }
          datasources.push(s);
        }

        hexMap = new Map({
          outputDirectory: '/tmp/hexmap',
          id: 'hex-mappy',
          name: 'hex-map',
          dataSources: datasources
         });
         hexMap.callbackWhenInitialized(function() {
           console.log('hex map initialized');
           console.log('hexmap', hexMap.dataSources);
           done();
         });
      });
    });
  });
  after(function(done) {
    this.timeout(0);
    async.eachSeries([rivers, land]/*, seaHexes, landHexes]*/, function(source, callback) {
      FeatureModel.deleteFeaturesBySourceId(source.id, function(count) {
        console.log('deleted %d %s features', count, source.id);
        callback();
      });
    }, function() {
      done();
    });
  });

  it('should pull a tile from the hex map', function (done) {
    this.timeout(0);

    // console.log('hexmap', JSON.stringify(hexMap, null, 2));

    // var mapString = JSON.stringify(hexMap, null, 2);
    // var ws = fs.createWriteStream('/tmp/hexmap.json');
    // var Readable = require('stream').Readable;
    // s = new Readable();
    // s.push(mapString);
    // s.push(null);
    //
    // s.pipe(ws);

    hexMap.getTile('png', 6, 13, 24, {noCache: true}, function(err, stream) {
      if (err) {
        done(err);
        return;
      }

      var ws = fs.createWriteStream('/tmp/hex_test.png');

      stream.pipe(ws);
      // stream.on('data', function(chunk) {
      //   ws.write(chunk);
      // });
      // stream.on('end', function() {
      //   ws.end();
      // });
      ws.on('finish', function() {
        done();
      });

    });
  });

  it('should construct a hex cache and pull the tile', function (done) {
    this.timeout(0);

    cacheModel.source = hexMap;
    cacheModel.outputDirectory = '/tmp/hexcache';

    var cache = new Cache(cacheModel);
    cache.callbackWhenInitialized(function(err, cache) {
      console.log('cache initialized');
      var xyzCache = new XYZ({cache: cache, outputDirectory: cacheModel.outputDirectory});
      console.log('xyzcache', xyzCache);
      xyzCache.generateCache(function(err, cache) {
        console.log('cache is done generating', cache);
        done();
      },
      function(cache, callback) {
        console.log('progress on the cache', cache);
        callback(null, cache);
      });
    });

    // cache.getTile('png', 0, 0, 0, {noCache: true}, function(err, stream) {
    //   if (err) {
    //     done(err);
    //     return;
    //   }
    //
    //   var ws = fs.createWriteStream('/tmp/vector_cache_test.png');
    //   stream.pipe(ws);
    //   stream.on('end', function() {
    //     done();
    //   });
    //
    // });
  });

  xit('should pull a tile from the map', function (done) {
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

  xit('should construct a cache and pull the tile', function (done) {
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

  xit('should construct a cache and pull the tile with no rivers', function (done) {
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
