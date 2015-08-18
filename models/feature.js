var knex = require('../db/knex')
	, turf = require('turf')
	, proj4 = require('proj4')
	, async = require('async')
	, config = require('../config.json');

exports.createFeatureForSource = function(feature, sourceId, callback) {
  var gj = JSON.stringify(feature.geometry);
	var envelope = turf.envelope(feature.geometry);
  knex('features').insert({
		source_id: sourceId,
		properties: feature.properties,
		geometry: knex.raw('ST_Transform(ST_SetSRID(ST_Force_2D(ST_MakeValid(ST_GeomFromGeoJSON(\''+gj+'\'))), 4326), 3857)'),
		box: knex.raw('ST_SetSRID(ST_Force_2D(ST_GeomFromGeoJSON(\''+JSON.stringify(envelope.geometry) +'\')), 4326)')
	}).then(callback);
}

exports.createFeatureForCache = function(feature, cacheId, callback) {
  var gj = JSON.stringify(feature.geometry);
  knex('features').insert({cacheId: cacheId, properties: feature.properties, geometry: knex.raw('ST_SetSRID(ST_Force_2D(ST_MakeValid(ST_GeomFromGeoJSON(\''+gj+'\'))), 4326)')}).then(callback);
}

exports.deleteFeaturesByCacheId = function(id, callback) {
  knex.where('cacheId', id).from('features').del().then(callback);
}

exports.deleteFeaturesBySourceId = function(id, callback) {
  knex.where('sourceId', id).from('features').del().then(callback);
}

exports.findFeaturesByCacheIdWithin = function(cacheId, west, south, east, north, callback) {
  knex.select('properties').select(knex.raw('ST_AsGeoJSON(geometry) as geometry')).where({cacheId: cacheId}).where(knex.raw('geometry && ST_MakeEnvelope('+west+','+south+','+east+','+north+')')).from('features').map(function(feature) {
    return {
      type:"Feature",
      properties: feature.properties,
      geometry: JSON.parse(feature.geometry)
    };
  }).then(function(collection){
    callback(null, collection);
  });
}

exports.findFeaturesBySourceIdWithin = function(sourceId, west, south, east, north, callback) {

  knex.select('properties').select(knex.raw('ST_AsGeoJSON(geometry) as geometry')).where({sourceId: sourceId}).where(knex.raw('geometry && ST_MakeEnvelope('+west+','+south+','+east+','+north+')')).from('features').map(function(feature) {
    return {
      type:"Feature",
      properties: feature.properties,
      geometry: JSON.parse(feature.geometry)
    };
  }).then(function(collection){
    callback(null, collection);
  });
}

exports.fetchTileForSourceId = function(sourceId, bbox, z, callback) {

	// CREATE OR REPLACE FUNCTION projectedTile (west double precision, south double precision, east double precision, north double precision, z integer, query text) RETURNS TABLE(geometry text, properties json)
	// AS $$
	// DECLARE
	// sql TEXT;
	// BEGIN
	// sql := 'with _conf as (
	//     select
	//         ST_XMin(ST_Transform(ST_MakeEnvelope(' || west || ', ' || south || ' , ' || east || ', ' || north || ', 4326),3857)) as tile_x,
	//         ST_XMax(ST_Transform(ST_MakeEnvelope(' || west || ', ' || south || ' , ' || east || ', ' || north || ', 4326),3857)) as tile_x_max,
	//         ST_YMin(ST_Transform(ST_MakeEnvelope(' || west || ', ' || south || ' , ' || east || ', ' || north || ', 4326),3857)) as tile_y,
	//         ST_YMax(ST_Transform(ST_MakeEnvelope(' || west || ', ' || south || ' , ' || east || ', ' || north || ', 4326),3857)) as tile_y_max,
	//         ST_Transform(ST_MakeEnvelope(' || GREATEST(-180, west - abs(east-west*.05)) || ', ' || GREATEST(-85,south - abs(north-south*.05)) || ' , ' || LEAST(180, east + abs(east-west*.05)) || ', ' || LEAST(85, north + abs(north-south*.05)) || ', 4326), 3857) as envelope
	//  ),
	//  _scale_conf as (
	//     select
	//        (4096/(tile_x_max-tile_x)) as x_scale,
	//        (4096/(tile_y_max-tile_y)) as y_scale
	// ),
	//  _geom as (
	//     select ST_Intersection(
	//         the_geom,
	//         envelope
	//     ) as _clip_geom, properties as properties from (' || query || ') _wrap, _conf
	// )
	// select ST_AsGeoJSON(ST_SimplifyPreserveTopology(ST_TransScale(_clip_geom, -tile_x, -tile_y, x_scale, y_scale), 16), 1) as geom, properties from _geom, _conf, _scale_conf where not ST_IsEmpty(_clip_geom) limit 100000



	console.time('fetching data');

	var bufferedBox = {
		west: Math.max(-180, bbox.west - Math.abs((bbox.east - bbox.west) * .02)),
		south: Math.max(-85, bbox.south - Math.abs((bbox.north - bbox.south) * .02)),
		east: Math.min(180, bbox.east + Math.abs((bbox.east - bbox.west) * .02)),
		north: Math.min(85, bbox.north + Math.abs((bbox.north - bbox.south) * .02))
	};

	var epsg3857ll = proj4('EPSG:3857', [bbox.west, bbox.south]);
	var epsg3857ur = proj4('EPSG:3857', [bbox.east, bbox.north]);
	console.log('epsg3857ll', epsg3857ll);


	knex.select(knex.raw(
		'ST_AsGeoJSON(ST_SimplifyPreserveTopology(ST_TransScale(ST_Intersection(geometry, ST_Transform(ST_MakeEnvelope('+bufferedBox.west+","+bufferedBox.south+","+bufferedBox.east+","+bufferedBox.north+', 4326),3857)), '+(-epsg3857ll[0])+', '+(-epsg3857ll[1])+', '+(4096/(epsg3857ur[0]-epsg3857ll[0]))+', '+(4096/(epsg3857ur[1]-epsg3857ll[1]))+'), 16), 1) as geometry'
		), 'properties'
	).from('features')
	.where(
		knex.raw('ST_Intersects(box, ST_MakeEnvelope('+bufferedBox.west+","+bufferedBox.south+","+bufferedBox.east+","+bufferedBox.north+', 4326))')
	)
	.andWhere({source_id: sourceId})
	.limit(100000)



	// knex.select('*').from(knex.raw("projectedTile("+bbox.west+","+bbox.south+","+bbox.east+","+bbox.north+","+z+", 'select properties as properties, geometry as the_geom from features where ST_Intersects(box, ST_MakeEnvelope("+bufferedBox.west+","+bufferedBox.south+","+bufferedBox.east+","+bufferedBox.north+", 4326)) and source_id=''"+sourceId+"''')"))
	.then(function(collection){
		console.timeEnd('fetching data');
		console.log('returned ' + collection.length + ' features');
    callback(null, collection);
  });
}
