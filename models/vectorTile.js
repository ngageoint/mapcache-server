var knex = require('../db/knex')
	, turf = require('turf')
	, config = require('../config.json');

exports.createTileForSource = function(tile, sourceId, x, y, z, callback) {
  knex('vector_tiles').insert({sourceId: sourceId, tile: tile, x: x, y: y, z: z}).then(callback);
}

exports.findTileBySourceId = function(sourceId, x, y, z, callback) {
  knex('vector_tiles').where({sourceId: sourceId, x: x, y: y, z: z}).first().then(function(tile) {
    callback(null, tile);
  });
}

function xyzToTms(z, y, x) {
  return {
    z: Number(z),
    x: Number(x),
    y: Math.pow(2, z) - y - 1
  }
}

exports.fetchTileForSourceId = function(sourceId, bbox, z, callback) {
		var featureCount = 0;
		var coordCount = 0;
  knex.select('*').from(knex.raw("tile("+bbox.west+","+bbox.south+","+bbox.east+","+bbox.north+","+z+", 'select properties as properties, geometry as the_geom from features where \"sourceId\"=''"+sourceId+"''')")).map(function(thing) {
		featureCount++;
		var geom = JSON.parse(thing.geometry);
		if (geom.coordinates[0] && geom.coordinates[0][0]) {
			console.log('geom coords', geom.coordinates[0]);
			coordCount += geom.coordinates[0].length;
		}
    return {
      properties: thing.properties,
      geometry: geom
    };
  }).then(function(collection){
		console.log('feature count', featureCount);
		console.log('coord count', coordCount);
    callback(null, collection);
  });
}
