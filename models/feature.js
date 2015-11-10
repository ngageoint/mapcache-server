var knex = require('./db/knex')
	, turf = require('turf')
	, proj4 = require('proj4')
	, async = require('async')
	, config = require('mapcache-config');

exports.createFeatureForSource = function(feature, sourceId, callback) {
  var gj = JSON.stringify(feature.geometry);
	var envelope = turf.envelope(feature.geometry);
  knex('features').insert({
		source_id: sourceId,
		properties: feature.properties,
		geometry: knex.raw('ST_Transform(ST_Intersection(ST_SetSRID(ST_Force_2D(ST_MakeValid(ST_GeomFromGeoJSON(\''+gj+'\'))), 4326), ST_MakeEnvelope(-180, -85, 180, 85, 4326)), 3857)'),
		box: knex.raw('ST_SetSRID(ST_Force_2D(ST_GeomFromGeoJSON(\''+JSON.stringify(envelope.geometry) +'\')), 4326)')
	}).then(callback);
}

exports.createFeatureForCache = function(feature, cacheId, callback) {
	var gj = JSON.stringify(feature.geometry);
	var envelope = turf.envelope(feature.geometry);
  knex('features').insert({
		cache_id: cacheId,
		properties: feature.properties,
		geometry: knex.raw('ST_Transform(ST_Intersection(ST_SetSRID(ST_Force_2D(ST_MakeValid(ST_GeomFromGeoJSON(\''+gj+'\'))), 4326), ST_MakeEnvelope(-180, -85, 180, 85, 4326)), 3857)'),
		box: knex.raw('ST_SetSRID(ST_Force_2D(ST_GeomFromGeoJSON(\''+JSON.stringify(envelope.geometry) +'\')), 4326)')
	}).then(callback);
}

exports.deleteFeaturesByCacheId = function(id, callback) {
  knex.where('cache_id', id).from('features').del().then(callback);
}

exports.deleteFeaturesBySourceId = function(id, callback) {
  knex.where('source_id', id).from('features').del().then(callback);
}

exports.findFeaturesByCacheIdWithin = function(cacheId, west, south, east, north, callback) {
	knex.select('properties', 'geometry').where({cache_id: cacheId}).where(knex.raw('ST_Intersects(geometry, ST_Transform(ST_MakeEnvelope('+west+','+south+','+east+','+north+', 4326), 3857))')).from('features').then(function(collection){
		console.log('collection', collection);
    callback(null, collection);
  });
}

exports.findFeaturesBySourceIdWithin = function(sourceId, west, south, east, north, callback) {
  knex.select('properties', knex.raw('ST_AsGeoJSON(geometry) as geometry')).where({source_id: sourceId}).where(knex.raw('ST_Intersects(geometry, ST_Transform(ST_MakeEnvelope('+west+','+south+','+east+','+north+', 4326), 3857))')).from('features').then(function(collection){
    callback(null, collection);
  });
}

exports.createCacheFeaturesFromSource = function(sourceId, cacheId, west, south, east, north, callback) {
	knex.raw('WITH row AS (SELECT source_id, \''+cacheId + '\' as cache_id, box, geometry, properties FROM features WHERE source_id = \''+ sourceId + '\' and ST_Intersects(geometry, ST_Transform(ST_MakeEnvelope('+west+','+south+','+east+','+north+', 4326), 3857))) INSERT INTO features (source_id, cache_id, box, geometry, properties) (SELECT * from row)')
	.then(function(collection) {
		callback(null, collection);
	});
}

exports.getAllCacheFeatures = function(cacheId, callback) {
	knex('features').select(
		knex.raw('ST_AsGeoJSON(ST_Transform(geometry, 4326)) as geometry'),
		'properties'
	).where({cache_id: cacheId}).then(function(collection) {
		callback(null, collection);
	});
}

exports.fetchTileForCacheId = function(cacheId, bbox, z, callback) {
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
		'ST_AsGeoJSON(ST_SimplifyPreserveTopology(ST_TransScale(ST_Intersection(geometry, ST_Transform(ST_MakeEnvelope('+ bufferedBox.west+","+bufferedBox.south+","+bufferedBox.east+","+bufferedBox.north+', 4326),3857)), '+ (-epsg3857ll[0])+', '+ (-epsg3857ll[1])+', '+ (4096/(epsg3857ur[0]-epsg3857ll[0]))+', '+ (4096/(epsg3857ur[1]-epsg3857ll[1])) + '), 16), 1) as geometry'
		),
		'properties'
	)
	.from('features')
	.whereRaw('ST_Intersects(box, ST_MakeEnvelope('+bufferedBox.west+","+bufferedBox.south+","+bufferedBox.east+","+bufferedBox.north+', 4326))')
	.andWhere({cache_id: cacheId})
	.limit(100000)
	.then(function(collection){
		console.timeEnd('fetching data');
		console.log('returned ' + collection.length + ' features');
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
		'ST_AsGeoJSON(ST_SimplifyPreserveTopology(ST_TransScale(ST_Intersection(geometry, ST_Transform(ST_MakeEnvelope('+ bufferedBox.west+","+bufferedBox.south+","+bufferedBox.east+","+bufferedBox.north+', 4326),3857)), '+ (-epsg3857ll[0])+', '+ (-epsg3857ll[1])+', '+ (4096/(epsg3857ur[0]-epsg3857ll[0]))+', '+ (4096/(epsg3857ur[1]-epsg3857ll[1])) + '), 16), 1) as geometry'
		),
		'properties'
	)
	.from('features')
	.whereRaw('ST_Intersects(box, ST_MakeEnvelope('+bufferedBox.west+","+bufferedBox.south+","+bufferedBox.east+","+bufferedBox.north+', 4326))')
	.andWhere({source_id: sourceId})
	.limit(100000)
	.then(function(collection){
		console.timeEnd('fetching data');
		console.log('returned ' + collection.length + ' features');
    callback(null, collection);
  });
}
