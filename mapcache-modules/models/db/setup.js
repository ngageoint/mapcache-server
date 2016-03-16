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
module.exports.knex = knex;
