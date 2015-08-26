var dbConfig = {
  client: 'pg',
  //"postgres://username:password@127.0.0.1/dbname"
  connection: {
    host     : '127.0.0.1',
    // user     : 'user',
    // password : 'password',
    database : 'mapcache',
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