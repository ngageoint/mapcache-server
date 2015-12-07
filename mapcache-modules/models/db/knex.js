var config = require('mapcache-config');

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

var knex = require('knex')(dbConfig);

knex.schema.hasTable('features').then(function(exists) {
  if (!exists) {
    return knex.schema.createTable('features', function(featureTable) {
      featureTable.increments('id').primary();
      featureTable.string('source_id').index();
      featureTable.string('cache_id').index();
      featureTable.json('properties');
      featureTable.specificType('box', 'geometry').index('features_box_idx', 'GIST');
      featureTable.specificType('geometry', 'geometry').index('features_geometry_idx', 'GIST');
    });
  }
});

knex.schema.hasTable('properties').then(function(exists) {
  if (!exists) {
    return knex.schema.createTable('properties', function(propertyTable) {
      propertyTable.increments('id').primary();
      propertyTable.string('source_id');
      propertyTable.string('key');
    });
  }
});

knex.schema.hasTable('values').then(function(exists) {
  if (!exists) {
    return knex.schema.createTable('values', function(valuesTable) {
      valuesTable.increments('id').primary();
      valuesTable.string('property_id').references('id').inTable('properties').onDelete('CASCADE');
      valuesTable.string('value').unique();
    });
  }
});

module.exports = knex;
