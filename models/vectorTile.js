var knex = require('../db/knex')
	, turf = require('turf')
	, config = require('../config.json');

exports.createTileForSource = function(tile, sourceId, x, y, z, callback) {
  knex('vector_tiles').insert({sourceId: sourceId, tile: tile, x: x, y: y, z: z}).then(callback);
}

// exports.deleteFeaturesByCacheId = function(id, callback) {
//   Feature.remove({cacheId: id}, callback);
// }
//
// exports.deleteFeaturesBySourceId = function(id, callback) {
//   Feature.remove({sourceId: id}, callback);
// }

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

  // postgres function wants tms
  //
  // var tms = xyzToTms(z, y, x);
  // console.log('x %d y %d z %d tms', x, y, z, tms)

  //tile(8,54,96, 'select ST_Transform(ST_SetSRID(geometry, 4326), 3857) as the_geom_webmercator from features')

  // knex.select(knex.raw("ST_AsGeoJSON(tile(8,54,96, 'select  ST_Transform(ST_SetSRID(geometry, 4326), 3857) as the_geom_webmercator from features'))")).map(function(thing) {
//knex.select(knex.raw("ST_AsGeoJSON(tile("+z+","+x+","+y+", 'select  ST_Transform(ST_SetSRID(geometry, 4326), 3857) as the_geom_webmercator from features'))")).map(function(thing) {
  // knex.select(knex.raw("ST_AsGeoJSON(ST_Transform(ST_SetSRID(tile("+tms.z+","+tms.x+","+tms.y+", 'select  ST_Transform(ST_SetSRID(geometry, 4326), 3857) as the_geom_webmercator from features where \"sourceId\"=''"+sourceId+"'''), 3857),4326))")).map(function(thing) {

  console.log('west %d south %d east %d north %d', bbox.west, bbox.south, bbox.east, bbox.north)

    // knex.select(knex.raw("ST_AsGeoJSON(ST_Transform(ST_SetSRID(tile("+bbox.west+","+bbox.south+","+bbox.east+","+bbox.north+","+z+", 'select  ST_Transform(ST_SetSRID(geometry, 4326), 3857) as the_geom_webmercator from features where \"sourceId\"=''"+sourceId+"'''), 3857),4326))")).map(function(thing) {
  knex.select('*').from(knex.raw("tile("+bbox.west+","+bbox.south+","+bbox.east+","+bbox.north+","+z+", 'select properties as properties, geometry as the_geom from features where \"sourceId\"=''"+sourceId+"''')")).map(function(thing) {

// ST_AsGeoJSON(ST_Transform(ST_SetSRID(tile(8,54,96, 'select  ST_Transform(ST_SetSRID(geometry, 4326), 3857) as the_geom_webmercator from features'), 3857),4326))
    // console.log('thing', thing);
    // return thing;
    // console.log('thing', thing);
    return {
      properties: thing.properties,
      geometry: JSON.parse(thing.geometry)
    };
  }).then(function(collection){
    callback(null, collection);
  });
  /*.then(function(tile) {
    console.log('tile', tile);
    callback(null, tile);
  });
  */
}
