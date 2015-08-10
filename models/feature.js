var knex = require('../db/knex')
	, turf = require('turf')
	, config = require('../config.json');

exports.createFeatureForSource = function(feature, sourceId, callback) {
  var gj = JSON.stringify(feature.geometry);
  knex('features').insert({sourceId: sourceId, properties: feature.properties, geometry: knex.raw('ST_SetSRID(ST_Force_2D(ST_GeomFromGeoJSON(\''+gj+'\')), 4326)')}).then(callback);
}

exports.createFeatureForCache = function(feature, cacheId, callback) {
  var gj = JSON.stringify(feature.geometry);
  knex('features').insert({cacheId: cacheId, properties: feature.properties, geometry: knex.raw('ST_SetSRID(ST_Force_2D(ST_GeomFromGeoJSON(\''+gj+'\')), 4326)')}).then(callback);
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
