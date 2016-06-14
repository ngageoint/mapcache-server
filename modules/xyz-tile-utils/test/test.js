var xyzTileUtils = require('../xyz-tile-utils');

var turf = require('turf')
  , fs = require('fs-extra');

describe('XYZ Tile Utils Tests', function() {

  it('should calculate the number of tiles in the zoom level', function() {
    var extent = [120.937500, 49.837982, 156.093750, 63.548552];
    var zoom = 8;
    var tiles = xyzTileUtils.tileCountInExtent(extent, zoom, zoom);
    tiles.should.be.equal(494);
  });

  it('should calculate the number of tiles in the 0 zoom level', function() {
    var extent = [-180, -85.0511, 180, 85.0511];
    var tiles = xyzTileUtils.tileCountInExtent(extent, 0, 0);
    tiles.should.be.equal(1);
  });

  it('should calculate the number of tiles in the 1 zoom level', function() {
    var zoom = 1;
    var extent = [-180, -85.0511, 180, 85.0511];
    var tiles = xyzTileUtils.tileCountInExtent(extent, zoom, zoom);
    tiles.should.be.equal(Math.pow(2, 2*zoom));
  });
  it('should calculate the number of tiles in the 2 zoom level', function() {
    var zoom = 2;
    var extent = [-180, -85.0511, 180, 85.0511];
    var tiles = xyzTileUtils.tileCountInExtent(extent, zoom, zoom);
    tiles.should.be.equal(Math.pow(2, 2*zoom));
  });
  it('should calculate the number of tiles in the 3 zoom level', function() {
    var zoom = 3;
    var extent = [-180, -85.0511, 180, 85.0511];
    var tiles = xyzTileUtils.tileCountInExtent(extent, zoom, zoom);
    tiles.should.be.equal(Math.pow(2, 2*zoom));
  });
  it('should calculate the number of tiles in the 4 zoom level', function() {
    var zoom = 4;
    var extent = [-180, -85.0511, 180, 85.0511];
    var tiles = xyzTileUtils.tileCountInExtent(extent, zoom, zoom);
    tiles.should.be.equal(Math.pow(2, 2*zoom));
  });
  it('should calculate the number of tiles in the 5 zoom level', function() {
    var zoom = 6;
    var extent = [-180, -85.0511, 180, 85.0511];
    var tiles = xyzTileUtils.tileCountInExtent(extent, zoom, zoom);
    tiles.should.be.equal(Math.pow(2, 2*zoom));
  });
  it('should calculate the number of tiles in the 7 zoom level', function() {
    var zoom = 7;
    var extent = [-180, -85.0511, 180, 85.0511];
    var tiles = xyzTileUtils.tileCountInExtent(extent, zoom, zoom);
    tiles.should.be.equal(Math.pow(2, 2*zoom));
  });
  it('should calculate the number of tiles in the 8 zoom level', function() {
    var zoom = 8;
    var extent = [-180, -85.0511, 180, 85.0511];
    var tiles = xyzTileUtils.tileCountInExtent(extent, zoom, zoom);
    tiles.should.be.equal(Math.pow(2, 2*zoom));
  });
  it('should calculate the number of tiles in the 9 zoom level', function() {
    var zoom = 9;
    var extent = [-180, -85.0511, 180, 85.0511];
    var tiles = xyzTileUtils.tileCountInExtent(extent, zoom, zoom);
    tiles.should.be.equal(Math.pow(2, 2*zoom));
  });
  it('should calculate the number of tiles in the 10 zoom level', function() {
    var zoom = 10;
    var extent = [-180, -85.0511, 180, 85.0511];
    var tiles = xyzTileUtils.tileCountInExtent(extent, zoom, zoom);
    tiles.should.be.equal(Math.pow(2, 2*zoom));
  });
  it('should calculate the number of tiles in the 11 zoom level', function() {
    var zoom = 11;
    var extent = [-180, -85.0511, 180, 85.0511];
    var tiles = xyzTileUtils.tileCountInExtent(extent, zoom, zoom);
    tiles.should.be.equal(Math.pow(2, 2*zoom));
  });
  it('should calculate the number of tiles in the 12 zoom level', function() {
    var zoom = 12;
    var extent = [-180, -85.0511, 180, 85.0511];
    var tiles = xyzTileUtils.tileCountInExtent(extent, zoom, zoom);
    tiles.should.be.equal(Math.pow(2, 2*zoom));
  });
  it('should calculate the number of tiles in the 13 zoom level', function() {
    var zoom = 13;
    var extent = [-180, -85.0511, 180, 85.0511];
    var tiles = xyzTileUtils.tileCountInExtent(extent, zoom, zoom);
    tiles.should.be.equal(Math.pow(2, 2*zoom));
  });
  it('should calculate the number of tiles in the 14 zoom level', function() {
    var zoom = 14;
    var extent = [-180, -85.0511, 180, 85.0511];
    var tiles = xyzTileUtils.tileCountInExtent(extent, zoom, zoom);
    tiles.should.be.equal(Math.pow(2, 2*zoom));
  });
  it('should calculate the number of tiles in the 15 zoom level', function() {
    var zoom = 15;
    var extent = [-180, -85.0511, 180, 85.0511];
    var tiles = xyzTileUtils.tileCountInExtent(extent, zoom, zoom);
    tiles.should.be.equal(Math.pow(2, 2*zoom));
  });
  it('should calculate the number of tiles in the 16 zoom level', function() {
    var zoom = 16;
    var extent = [-180, -85.0511, 180, 85.0511];
    var tiles = xyzTileUtils.tileCountInExtent(extent, zoom, zoom);
    tiles.should.be.equal(Math.pow(2, 2*zoom));
  });
  it('should calculate the number of tiles in the 17 zoom level', function() {
    var zoom = 17;
    var extent = [-180, -85.0511, 180, 85.0511];
    var tiles = xyzTileUtils.tileCountInExtent(extent, zoom, zoom);
    tiles.should.be.equal(Math.pow(2, 2*zoom));
  });
  it('should calculate the number of tiles in the 18 zoom level', function() {
    var zoom = 18;
    var extent = [-180, -85.0511, 180, 85.0511];
    var tiles = xyzTileUtils.tileCountInExtent(extent, zoom, zoom);
    tiles.should.be.equal(Math.pow(2, 2*zoom));
  });

  it('should calculate the number of tiles in the 5 and 6 zoom level by geometry rectangle', function() {
    var zoom = 1;
    var extent = [-180, -85.0511, 180, 85.0511];
    var poly = turf.bboxPolygon(extent);
    var fc = turf.featureCollection([poly]);
    var tiles = xyzTileUtils.tilesInGeometry(fc, zoom, zoom+1);
    Object.keys(tiles[1]).length.should.be.equal(Math.pow(2, 2*1));
    Object.keys(tiles[2]).length.should.be.equal(Math.pow(2, 2*2));
  });

  describe('Aurora Reservoir geometry tests', function() {
    var json;
    var fc;

    before(function(done) {
      fs.readJson(__dirname + '/aurora-reservoir.geojson', function(err, fc) {
        json = fc;
        done();
      });
    });

    beforeEach(function(done) {
      fc = JSON.parse(JSON.stringify(json));
      done();
    });

    it('should calculate the number of tiles in the 5 and 6 zoom level', function() {
      var zoom = 5;
      var tiles = xyzTileUtils.tilesInGeometry(fc, zoom, zoom+1);
      Object.keys(tiles[5]).length.should.be.equal(1);
      Object.keys(tiles[6]).length.should.be.equal(1);
    });

    it('should calculate the number of tiles in the 12 zoom level', function() {
      var zoom = 12;
      var tiles = xyzTileUtils.tilesInGeometry(fc, zoom, zoom);
      Object.keys(tiles[12]).length.should.be.equal(2);
    });

    it('should calculate the number of tiles in the 1 - 17 zoom level', function() {
      var zoom = 17;
      var tiles = xyzTileUtils.tilesInGeometry(fc, 1, zoom);
      Object.keys(tiles[17]).length.should.be.equal(87);
      Object.keys(tiles[16]).length.should.be.equal(29);
      Object.keys(tiles[15]).length.should.be.equal(11);
      Object.keys(tiles[14]).length.should.be.equal(5);
      Object.keys(tiles[13]).length.should.be.equal(3);
      Object.keys(tiles[12]).length.should.be.equal(2);
      Object.keys(tiles[11]).length.should.be.equal(1);
      Object.keys(tiles[10]).length.should.be.equal(1);
      Object.keys(tiles[9]).length.should.be.equal(1);
      Object.keys(tiles[8]).length.should.be.equal(1);
      Object.keys(tiles[7]).length.should.be.equal(1);
      Object.keys(tiles[6]).length.should.be.equal(1);
      Object.keys(tiles[5]).length.should.be.equal(1);
      Object.keys(tiles[4]).length.should.be.equal(1);
      Object.keys(tiles[3]).length.should.be.equal(1);
      Object.keys(tiles[2]).length.should.be.equal(1);
      Object.keys(tiles[1]).length.should.be.equal(1);

      // for (var i = 1; i <= zoom; i++) {
      //   var fc = xyzTileUtils.tilesToFeatureCollection(tiles[i], i);
      //   fs.writeJsonSync('/tmp/zoom'+i+'.geojson', fc);
      // }
    });

  });

  describe('Aurora Reservoir and Cherry Creek Reservoir geometry tests', function() {
    var fc;
    var json;

    before(function(done) {
      fs.readJson(__dirname + '/arcc.geojson', function(err, fc) {
        json = fc;
        done();
      });
    });

    beforeEach(function(done) {
      fc = JSON.parse(JSON.stringify(json));
      done();
    });

    it('should calculate the number of tiles in the 5 and 6 zoom level', function() {
      var zoom = 5;
      var tiles = xyzTileUtils.tilesInGeometry(fc, zoom, zoom+1);
      Object.keys(tiles[5]).length.should.be.equal(1);
      Object.keys(tiles[6]).length.should.be.equal(1);
    });

    it('should calculate the number of tiles in the 12 zoom level by geometry', function() {
      var zoom = 12;
      var tiles = xyzTileUtils.tilesInGeometry(fc, zoom, zoom);
      Object.keys(tiles[12]).length.should.be.equal(6);
    });

    it('should calculate the number of tiles in the 1 - 17 zoom level by geometry', function() {
      var zoom = 17;
      var tiles = xyzTileUtils.tilesInGeometry(fc, 1, zoom);
      Object.keys(tiles[17]).length.should.be.equal(174);
      Object.keys(tiles[16]).length.should.be.equal(56);
      Object.keys(tiles[15]).length.should.be.equal(20);
      Object.keys(tiles[14]).length.should.be.equal(9);
      Object.keys(tiles[13]).length.should.be.equal(7);
      Object.keys(tiles[12]).length.should.be.equal(6);
      Object.keys(tiles[11]).length.should.be.equal(3);
      Object.keys(tiles[10]).length.should.be.equal(3);
      Object.keys(tiles[9]).length.should.be.equal(2);
      Object.keys(tiles[8]).length.should.be.equal(1);
      Object.keys(tiles[7]).length.should.be.equal(1);
      Object.keys(tiles[6]).length.should.be.equal(1);
      Object.keys(tiles[5]).length.should.be.equal(1);
      Object.keys(tiles[4]).length.should.be.equal(1);
      Object.keys(tiles[3]).length.should.be.equal(1);
      Object.keys(tiles[2]).length.should.be.equal(1);
      Object.keys(tiles[1]).length.should.be.equal(1);

      // for (var i = 1; i <= zoom; i++) {
      //   var fc = xyzTileUtils.tilesToFeatureCollection(tiles[i], i);
      //   fs.writeJsonSync('/tmp/zoom'+i+'.geojson', fc);
      // }
    });

  });

  describe('Aurora Reservoir and Cherry Creek Reservoir with connecting road geometry tests', function() {
    var fc;
    var json;

    before(function(done) {
      fs.readJson(__dirname + '/arccroad.geojson', function(err, fc) {
        json = fc;
        done();
      });
    });

    beforeEach(function(done) {
      fc = JSON.parse(JSON.stringify(json));
      done();
    });

    it('should calculate the number of tiles in the 5 and 6 zoom level by geometry', function() {
      var zoom = 5;
      var tiles = xyzTileUtils.tilesInGeometry(fc, zoom, zoom+1);
      Object.keys(tiles[5]).length.should.be.equal(1);
      Object.keys(tiles[6]).length.should.be.equal(1);
    });

    it('should calculate the number of tiles in the 12 zoom level by geometry', function() {
      var zoom = 12;
      var tiles = xyzTileUtils.tilesInGeometry(fc, zoom, zoom);
      Object.keys(tiles[12]).length.should.be.equal(6);
    });

    it('should calculate the number of tiles in the 1 - 17 zoom level by geometry', function() {
      var zoom = 17;
      var tiles = xyzTileUtils.tilesInGeometry(fc, 1, zoom);

      // for (var i = 1; i <= zoom; i++) {
      //   var fc = xyzTileUtils.tilesToFeatureCollection(tiles[i], i);
      //   fs.writeJsonSync('/tmp/zoom'+i+'.geojson', fc);
      // }

      Object.keys(tiles[17]).length.should.be.equal(316);
      Object.keys(tiles[16]).length.should.be.equal(123);
      Object.keys(tiles[15]).length.should.be.equal(49);
      Object.keys(tiles[14]).length.should.be.equal(22);
      Object.keys(tiles[13]).length.should.be.equal(11);
      Object.keys(tiles[12]).length.should.be.equal(6);
      Object.keys(tiles[11]).length.should.be.equal(3);
      Object.keys(tiles[10]).length.should.be.equal(3);
      Object.keys(tiles[9]).length.should.be.equal(2);
      Object.keys(tiles[8]).length.should.be.equal(1);
      Object.keys(tiles[7]).length.should.be.equal(1);
      Object.keys(tiles[6]).length.should.be.equal(1);
      Object.keys(tiles[5]).length.should.be.equal(1);
      Object.keys(tiles[4]).length.should.be.equal(1);
      Object.keys(tiles[3]).length.should.be.equal(1);
      Object.keys(tiles[2]).length.should.be.equal(1);
      Object.keys(tiles[1]).length.should.be.equal(1);
    });
  });

  describe('Aurora Reservoir and Cherry Creek Reservoir with connecting road and airport point geometry tests', function() {
    var fc;
    var json;

    before(function(done) {
      fs.readJson(__dirname + '/arccroadairport.geojson', function(err, fc) {
        json = fc;
        done();
      });
    });

    beforeEach(function(done) {
      fc = JSON.parse(JSON.stringify(json));
      done();
    });

    it('should calculate the number of tiles in the 5 and 6 zoom level by geometry', function() {
      var zoom = 5;
      var tiles = xyzTileUtils.tilesInGeometry(fc, zoom, zoom+1);
      Object.keys(tiles[5]).length.should.be.equal(1);
      Object.keys(tiles[6]).length.should.be.equal(1);
    });

    it('should calculate the number of tiles in the 12 zoom level by geometry', function() {
      var zoom = 12;
      var tiles = xyzTileUtils.tilesInGeometry(fc, zoom, zoom);
      Object.keys(tiles[12]).length.should.be.equal(7);
    });

    it('should calculate the number of tiles in the 1 - 17 zoom level by geometry', function() {
      var zoom = 17;
      var tiles = xyzTileUtils.tilesInGeometry(fc, 1, zoom);

      // for (var i = 1; i <= zoom; i++) {
      //   var fc = xyzTileUtils.tilesToFeatureCollection(tiles[i], i);
      //   fs.writeJsonSync('/tmp/zoom'+i+'.geojson', fc);
      // }

      Object.keys(tiles[17]).length.should.be.equal(320);
      Object.keys(tiles[16]).length.should.be.equal(125);
      Object.keys(tiles[15]).length.should.be.equal(50);
      Object.keys(tiles[14]).length.should.be.equal(23);
      Object.keys(tiles[13]).length.should.be.equal(12);
      Object.keys(tiles[12]).length.should.be.equal(7);
      Object.keys(tiles[11]).length.should.be.equal(4);
      Object.keys(tiles[10]).length.should.be.equal(4);
      Object.keys(tiles[9]).length.should.be.equal(2);
      Object.keys(tiles[8]).length.should.be.equal(1);
      Object.keys(tiles[7]).length.should.be.equal(1);
      Object.keys(tiles[6]).length.should.be.equal(1);
      Object.keys(tiles[5]).length.should.be.equal(1);
      Object.keys(tiles[4]).length.should.be.equal(1);
      Object.keys(tiles[3]).length.should.be.equal(1);
      Object.keys(tiles[2]).length.should.be.equal(1);
      Object.keys(tiles[1]).length.should.be.equal(1);

    });
  });

});
