var knex = require('./db/knex')
	, turf = require('turf')
	, proj4 = require('proj4')
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

exports.findFeaturesByCacheIdWithin = function(cacheId, west, south, east, north, projection, callback) {
	var geometrySelect = createGeometrySelect(projection, {west: west, south: south, east: east, north: north});
	knex.select(geometrySelect, 'properties')
	.from('features')
	.whereRaw('ST_Intersects(box, ST_MakeEnvelope('+west+","+south+","+east+","+north+', 4326))')
	.andWhere({cache_id: cacheId})
	.then(function(collection){
		console.log('returned ' + collection.length + ' features');
    callback(null, collection);
  });
}

exports.findFeaturesBySourceIdWithin = function(sourceId, west, south, east, north, projection, callback) {
	var geometrySelect = createGeometrySelect(projection, {west: west, south: south, east: east, north: north});

	knex.select(geometrySelect,'properties')
	.from('features')
	.whereRaw('ST_Intersects(box, ST_MakeEnvelope('+west+","+south+","+east+","+north+', 4326))')
	.andWhere({source_id: sourceId})
	.then(function(collection){
		console.timeEnd('fetching data');
		console.log('returned ' + collection.length + ' features');
		callback(null, collection);
	});
}

exports.createCacheFeaturesFromSource = function(sourceId, cacheId, west, south, east, north, callback) {
	knex.raw('WITH row AS (SELECT source_id, \''+cacheId + '\' as cache_id, box, geometry, properties FROM features WHERE source_id = \''+ sourceId + '\' and ST_Intersects(geometry, ST_Transform(ST_MakeEnvelope('+west+','+south+','+east+','+north+', 4326), 3857))) INSERT INTO features (source_id, cache_id, box, geometry, properties) (SELECT * from row)')
	.then(function(collection) {
		callback(null, collection);
	});
}

exports.getAllSourceFeatures = function(sourceId, callback) {
	knex('features').select(
		knex.raw('ST_AsGeoJSON(ST_Transform(geometry, 4326)) as geometry'),
		'properties'
	).where({source_id: sourceId}).then(function(collection) {
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

exports.fetchTileForCacheId = function(cacheId, bbox, z, projection, callback) {
	if (!callback && typeof projection === 'function') {
		callback = projection;
		projection = null;
	}
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

	var geometrySelect = createGeometrySelect(projection, bufferedBox, {west: epsg3857ll[0], south: epsg3857ll[1], east: epsg3857ur[0], north: epsg3857ur[1]});

	knex.select(geometrySelect, 'properties')
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

function createGeometrySelect(projection, queryBox, transformationBox) {
	var geometrySelect;
	if (!projection || projection == 'vector') {
		geometrySelect = knex.raw(
			'ST_AsGeoJSON(ST_SimplifyPreserveTopology(ST_TransScale(ST_Intersection(geometry, ST_Transform(ST_MakeEnvelope('+ queryBox.west+","+queryBox.south+","+queryBox.east+","+queryBox.north+', 4326),3857)), '+ (-transformationBox.west)+', '+ (-transformationBox.south)+', '+ (4096/(transformationBox.east-transformationBox.west))+', '+ (4096/(transformationBox.north-transformationBox.south)) + '), 16), 1) as geometry'
		);
	} else if (projection == '3857') {
		geometrySelect = knex.raw(
			'ST_AsGeoJSON('+
				'ST_Intersection('+
					'geometry, '+
					'ST_Transform('+
						'ST_MakeEnvelope('+
							queryBox.west+","+queryBox.south+","+queryBox.east+","+queryBox.north+
							', 4326'+
						'),'+
					'3857)'+
				') '+
			') as geometry'
		);
	} else {
		geometrySelect = knex.raw(
			'ST_AsGeoJSON('+
				'ST_Transform('+
					'ST_Intersection('+
						'geometry, '+
						'ST_Transform('+
							'ST_MakeEnvelope('+
								queryBox.west+","+queryBox.south+","+queryBox.east+","+queryBox.north+
								', 4326'+
							'),'+
						'3857)'+
					') '+
				', '+projection+ ')' +
			') as geometry'
		);
	}
	return geometrySelect;
}

exports.fetchTileForSourceId = function(sourceId, bbox, z, projection, callback) {
	if (!callback && typeof projection === 'function') {
		callback = projection;
		projection = null;
	}
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

	var geometrySelect = createGeometrySelect(projection, bufferedBox, {west: epsg3857ll[0], south: epsg3857ll[1], east: epsg3857ur[0], north: epsg3857ur[1]});

	knex.select(geometrySelect,'properties')
	.from('features')
	.whereRaw('ST_Intersects(box, ST_MakeEnvelope('+bufferedBox.west+","+bufferedBox.south+","+bufferedBox.east+","+bufferedBox.north+', 4326))')
	.andWhere({source_id: sourceId})
	// .limit(100000)
	.then(function(collection){
		console.timeEnd('fetching data');
		console.log('returned ' + collection.length + ' features');
    callback(null, collection);
  });
}
