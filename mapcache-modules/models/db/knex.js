var config = require('mapcache-config')
  , async = require('async')
  , q = require('q');

var dbConfig = {
  client: 'pg',
  connection: {
    host     : config.server.postgres.host,
    user     : config.server.postgres.user,
    password : config.server.postgres.password,
    database : config.server.postgres.database,
    charset  : 'utf8'
  }
};

var initDefer = q.defer();
var initPromise = initDefer.promise;

var knex = require('knex')(dbConfig);

function getKnex(callback) {
  return initPromise.then(callback);
}

async.series([
  createFeaturesTable,
  createPropertiesTable,
  createValuesTable
],
function() {
  initDefer.resolve(knex);
});

function createFeaturesTable(callback) {
  knex.schema.hasTable('features').then(function(exists) {
    if (!exists) {
      return knex.schema.createTable('features', function(featureTable) {
        featureTable.increments('id').primary();
        featureTable.string('source_id').index();
        featureTable.string('cache_id').index();
        featureTable.integer('layer_id').index();
        featureTable.json('properties');
        featureTable.specificType('box', 'geometry').index('features_box_idx', 'GIST');
        featureTable.specificType('geometry', 'geometry').index('features_geometry_idx', 'GIST');
        callback();
      });
    } else {
      knex.schema.hasColumn('features', 'layer_id').then(function(exists) {
        if (!exists) {
          knex.schema.table('features', function(featureTable) {
            featureTable.integer('layer_id').index();
            callback();
          })
          // I don't understand why I have to have this then() to make the previous
          // statement run but I do....
          .then(function() {
          });
        } else {
          callback();
        }
      });
    }
  });
}

function createPropertiesTable(callback) {
  knex.schema.hasTable('properties').then(function(exists) {
    if (!exists) {
      return knex.schema.createTable('properties', function(propertyTable) {
        propertyTable.increments('id').primary();
        propertyTable.string('source_id');
        propertyTable.string('key');
        callback();
      });
    } else {
      callback();
    }
  });
}

function createValuesTable(callback) {
  knex.schema.hasTable('values').then(function(exists) {
    if (!exists) {
      return knex.schema.createTable('values', function(valuesTable) {
        valuesTable.increments('id').primary();
        valuesTable.string('property_id').references('id').inTable('properties').onDelete('CASCADE');
        valuesTable.string('value').unique();
        callback();
      });
    } else {
      callback();
    }
  });
}

module.exports = getKnex;
