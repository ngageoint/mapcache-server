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

module.exports = knex;
