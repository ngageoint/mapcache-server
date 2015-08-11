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
      featureTable.string('sourceId');
      featureTable.string('cacheId');
      featureTable.json('properties');
      featureTable.specificType('geometry', 'geometry');
    });
  }
});

knex.schema.hasTable('vector_tiles').then(function(exists) {
  if (!exists) {
    return knex.schema.createTable('vector_tiles', function(featureTable) {
      featureTable.increments('id').primary();
      featureTable.string('sourceId');
      featureTable.string('cacheId');
      featureTable.json('tile');
      featureTable.integer('x');
      featureTable.integer('y');
      featureTable.integer('z');
      featureTable.specificType('geometry', 'geometry');
    });
  }
});

/*

CREATE OR REPLACE FUNCTION tile (west double precision, south double precision, east double precision, north double precision, z integer, query text) RETURNS TABLE(geometry text, properties json)
AS $$
DECLARE
sql TEXT;
BEGIN
sql := 'with _conf as (
    select
        ST_XMin(ST_Transform(ST_MakeEnvelope(' || west || ', ' || south || ' , ' || east || ', ' || north || ', 4326),3857)) as tile_x,
        ST_XMax(ST_Transform(ST_MakeEnvelope(' || west || ', ' || south || ' , ' || east || ', ' || north || ', 4326),3857)) as tile_x_max,
        ST_YMin(ST_Transform(ST_MakeEnvelope(' || west || ', ' || south || ' , ' || east || ', ' || north || ', 4326),3857)) as tile_y,
        ST_YMax(ST_Transform(ST_MakeEnvelope(' || west || ', ' || south || ' , ' || east || ', ' || north || ', 4326),3857)) as tile_y_max
 ),
 _geom as (
    select ST_Intersection(
        the_geom,
        ST_MakeEnvelope(' || GREATEST(-180, west - abs(east-west*.05)) || ', ' || GREATEST(-85,south - abs(north-south*.05)) || ' , ' || LEAST(180, east + abs(east-west*.05)) || ', ' || LEAST(85, north + abs(north-south*.05)) || ', 4326)
    ) as _clip_geom, properties as properties from (' || query || ') _wrap, _conf where the_geom && ST_MakeEnvelope(' || GREATEST(-180, west - abs(east-west*.05)) || ', ' || GREATEST(-85, south - abs(north-south*.05)) || ' , ' || LEAST(180, east + abs(east-west*.05)) || ', ' || LEAST(85, north + abs(north-south*.05)) || ', 4326)
)
select ST_AsGeoJSON(ST_SimplifyPreserveTopology(ST_TransScale(ST_Transform(_clip_geom, 3857), -tile_x, -tile_y, (4096/(tile_x_max-tile_x)), (4096/(tile_y_max-tile_y))), 4096/256), 1) as geom, properties from _geom, _conf where not ST_IsEmpty(_clip_geom) limit 10000

';
-- RAISE NOTICE 'sql: %', sql;
RETURN QUERY EXECUTE sql;

END;
$$ LANGUAGE plpgsql;



*/

module.exports = knex;
