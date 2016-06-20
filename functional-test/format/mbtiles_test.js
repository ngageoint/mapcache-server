var path = require('path')
  , fs = require('fs-extra')
  , should = require('should')
  , Map = require('../../map/map')
  , Cache = require('../../cache/cache')
  , turf = require('turf');

var MBTiles = require('../../format/mbtiles');

describe.only('mbtiles tests', function() {

  it('should extract the mbtiles file', function(done) {
    var file = path.join(__filename, '..', '..', '..', 'utilities', 'mbutil', 'test', 'data', 'one_tile.mbtiles');
    fs.copy(file, '/tmp/mbtiles_ex.mbtiles', function(err) {
      var source = {
        file: {
          path: '/tmp/mbtiles_ex.mbtiles'
        }
      };
      var mbtiles = new MBTiles({
        source:source
      });
      mbtiles.processSource(function(err, source) {
        console.log('err', err);
        console.log('source', JSON.stringify(source, null, 2));
        source.status.complete.should.be.equal(true);
        source.minZoom.should.be.equal(0);
        source.maxZoom.should.be.equal(1);
        source.geometry.should.deepEqual({
          "type": "Feature",
          "properties": {},
          "geometry": {
            "type": "Polygon",
            "coordinates": [
              [
                [
                  -139.9219,
                  53.3309
                ],
                [
                  -75.2344,
                  53.3309
                ],
                [
                  -75.2344,
                  76.6798
                ],
                [
                  -139.9219,
                  76.6798
                ],
                [
                  -139.9219,
                  53.3309
                ]
              ]
            ]
          }
        });
        done();
      });
    });
  });

  it('should get the 0/0/0 tile for the mbtiles source', function(done) {
    var file = path.join(__filename, '..', '..', '..', 'utilities', 'mbutil', 'test', 'data', 'one_tile.mbtiles');
    fs.copy(file, '/tmp/mbtiles_ex.mbtiles', function(err) {
      var source = {
        file: {
          path: '/tmp/mbtiles_ex.mbtiles'
        }
      };
      var mbtiles = new MBTiles({
        source:source
      });
      mbtiles.processSource(function(err, source) {
        mbtiles.getTile('png', 0, 0, 0, {}, function(err, stream) {
          should.not.exist(err);
          should.exist(stream);
          done();
        });
      });
    });
  });

  it('should get the generate the mbtiles cache', function(done) {
    this.timeout(5000);
    var dataSource = {
      id: 'test-ds',
      name: 'osm',
      format: 'xyz',
      url: 'http://osm.geointservices.io/osm_tiles',
      zOrder: 0
    };

    var mapModel = {
      id: 'test-map',
      dataSources: [dataSource]
    };

    var cacheModel = {
      id: 'test-cache',
      name: 'generic test cache',
      minZoom: 0,
      maxZoom: 3,
      geometry: turf.polygon([[
        [-179, -85],
        [-179, 85],
        [179, 85],
        [179, -85],
        [-179, -85]
      ]]),
      source: mapModel,
      outputDirectory: '/tmp/mapcache-test'
    };

    var map;
    var cache;
    fs.mkdirsSync(cacheModel.outputDirectory);
    cache = new Cache(cacheModel);
    cache.callbackWhenInitialized(function() {
      cache.generateFormat('mbtiles', function(err, cache) {
        console.log('done');
        cache.getData('mbtiles', cacheModel.minZoom, cacheModel.maxZoom, function(err, data) {
          var stream = data.stream;
          var ws = fs.createOutputStream(path.join('/tmp', 'mbtiles'+cacheModel.id+data.extension));
          ws.on('close', function() {
            done();
          });
          stream.pipe(ws);
        });
      }, function(cache, callback) {
        callback(null, cache);
      });
    });

  });


  // it('should get the 0/0/0 tile for the mbtiles cache', function(done) {
  //   var dataSource = {
  //     id: 'test-ds',
  //     name: 'osm',
  //     format: 'xyz',
  //     url: 'http://osm.geointservices.io/osm_tiles',
  //     zOrder: 0
  //   };
  //
  //   var mapModel = {
  //     id: 'test-map',
  //     dataSources: [dataSource]
  //   };
  //
  //   var cacheModel = {
  //     id: 'test-cache',
  //     name: 'generic test cache',
  //     minZoom: 0,
  //     maxZoom: 3,
  //     geometry: turf.polygon([[
  //       [-179, -85],
  //       [-179, 85],
  //       [179, 85],
  //       [179, -85],
  //       [-179, -85]
  //     ]]),
  //     source: mapModel,
  //     outputDirectory: '/tmp/mapcache-test'
  //   };
  //
  //   var map;
  //   var cache;
  //   fs.mkdirsSync(cacheModel.outputDirectory);
  //   cache = new Cache(cacheModel);
  //   cache.callbackWhenInitialized(function() {
  //     done();
  //   });
  //
  // });

});
