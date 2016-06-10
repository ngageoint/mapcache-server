var xyzTileUtils = require('xyz-tile-utils');

describe('XYZ Tile Utils Tests', function() {

  it('should calculate the number of tiles in the zoom level', function(done) {
    var extent = [120.937500, 49.837982, 156.093750, 63.548552];
    var zoom = 8;
    var tiles = xyzTileUtils.tileCountInExtent(extent, zoom, zoom);
    console.log('tile count: %d', tiles);

    var yRange = xyzTileUtils.calculateYTileRange(extent, zoom);
    var xRange = xyzTileUtils.calculateXTileRange(extent, zoom);

    console.log('yrange:', yRange);
    console.log('xrange:', xRange);

    var yTiles = 1+(yRange.max - yRange.min);
    var xTiles = 1+(xRange.max - xRange.min);

    var tiles = yTiles * xTiles;

    console.log('tiles', tiles);

    done();
  });

});
