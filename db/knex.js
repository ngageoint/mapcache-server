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
      featureTable.string('source_id');
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
        ST_YMax(ST_Transform(ST_MakeEnvelope(' || west || ', ' || south || ' , ' || east || ', ' || north || ', 4326),3857)) as tile_y_max,
        ST_MakeEnvelope(' || GREATEST(-180, west - abs(east-west*.05)) || ', ' || GREATEST(-85,south - abs(north-south*.05)) || ' , ' || LEAST(180, east + abs(east-west*.05)) || ', ' || LEAST(85, north + abs(north-south*.05)) || ', 4326) as envelope,
        ST_MakeEnvelope(' || GREATEST(-180, west - abs(east-west*.05)) || ', ' || GREATEST(-85, south - abs(north-south*.05)) || ' , ' || LEAST(180, east + abs(east-west*.05)) || ', ' || LEAST(85, north + abs(north-south*.05)) || ', 4326) as buffered_envelope
 ),
 _scale_conf as (
    select
       (4096/(tile_x_max-tile_x)) as x_scale,
       (4096/(tile_y_max-tile_y)) as y_scale,
       4096/256 as resolution from _conf
),
 _geom as (
    select ST_Intersection(
        the_geom,
        envelope
    ) as _clip_geom, properties as properties from (' || query || ') _wrap, _conf where the_geom && buffered_envelope
)
select ST_AsGeoJSON(ST_SimplifyPreserveTopology(ST_TransScale(ST_Transform(_clip_geom, 3857), -tile_x, -tile_y, x_scale, y_scale), resolution), 1) as geom, properties from _geom, _conf, _scale_conf where not ST_IsEmpty(_clip_geom) limit 100000

';
-- RAISE NOTICE 'sql: %', sql;
RETURN QUERY EXECUTE sql;

END;
$$ LANGUAGE plpgsql;



select * FROM tile(-180,-85,180,85, 0, 'select properties as properties, geometry as the_geom from features where "sourceId"=''55cb595dc0339d5ff9e979fc''');

select * FROM tile(ST_MakeEnvelope(-180, -85, 180, 85, 4326), ST_MakeEnvelope(-180, -85, 180, 85, 4326), ST_XMin(ST_Transform(ST_SetSRID(ST_Point(-180, -85),4326),3857)), ST_YMin(ST_Transform(ST_SetSRID(ST_Point(-180, -85),4326),3857)), ST_XMax(ST_Transform(ST_SetSRID(ST_Point(180, 85),4326),3857)), ST_YMax(ST_Transform(ST_SetSRID(ST_Point(180, 85),4326),3857)), 0, 'select properties as properties, geometry as the_geom from features where "sourceId"=''55cb595dc0339d5ff9e979fc''');


  select
    properties as properties,
    ST_AsGeoJSON(
      ST_TransScale(
        ST_SimplifyPreserveTopology(
          ST_Transform(
            ST_Intersection(
              geometry,
              ST_MakeEnvelope(-180, -85, 180, 85, 4326)
            ),
          3857),
        16),
        -ST_XMin(
          ST_Transform(
            ST_SetSRID(
              ST_Point(-180, -85),
            4326),
          3857)
        ),
        -ST_YMin(
          ST_Transform(
            ST_SetSRID(
              ST_Point(-180, -85),
            4326),
          3857)
        ),
        1,
        1
      ),
    1) as intersection
    from features where "sourceId"='55cb595dc0339d5ff9e979fc' AND geometry && ST_MakeEnvelope(-180, -85, 180, 85, 4326);

    select
      properties as properties,
              ST_Intersection(
                geometry,
                ST_MakeEnvelope(-180, -85, 180, 85, 4326)
              ) as intersection
      from features where "sourceId"='55cb595dc0339d5ff9e979fc' AND geometry && ST_MakeEnvelope(-180, -85, 180, 85, 4326);

    PREPARE prepared_tile (double precision, double precision, double precision, double precision) as
      select
        properties as properties,
                ST_Intersection(
                  geometry,
                  ST_MakeEnvelope($1, $2, $3, $4, 4326)
                ) as intersection
        from features where "sourceId"='55cb595dc0339d5ff9e979fc' AND geometry && ST_MakeEnvelope($1, $2, $3, $4, 4326);

        EXECUTE prepared_tile(-180, -85, 180, 85);


CREATE OR REPLACE FUNCTION tile (envelope geometry, buffered_envelope geometry, tile_x double precision, tile_y double precision, tile_x_max double precision, tile_y_max double precision, z integer, query text) RETURNS TABLE(geometry text, properties json)
AS $$
DECLARE
sql TEXT;
BEGIN
sql := 'with _scale_conf as (
    select
       (4096/(' || tile_x_max - tile_x || ')) as x_scale,
       (4096/(' || tile_y_max - tile_y || ')) as y_scale
),
 _geom as (
    select ST_Intersection(
        the_geom,
        $1
    ) as _clip_geom, properties as properties from (' || query || ') _wrap where the_geom && $2
)
select ST_AsGeoJSON(ST_TransScale(ST_SimplifyPreserveTopology(ST_Transform(_clip_geom, 3857), 16), ' || -tile_x || ', ' || -tile_y || ', x_scale, y_scale), 1) as geom, properties from _geom, _scale_conf where not ST_IsEmpty(_clip_geom) limit 1000000

';
-- RAISE NOTICE 'sql: %', sql;
RETURN QUERY EXECUTE sql USING envelope, buffered_envelope;

END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION tile (envelope geometry, buffered_envelope geometry, tile_x double precision, tile_y double precision, tile_x_max double precision, tile_y_max double precision, z integer, query text) RETURNS TABLE(geometry text, properties json)
AS $$
DECLARE
sql TEXT;
BEGIN
sql := 'with _scale_conf as (
    select
       (4096/(' || tile_x_max - tile_x || ')) as x_scale,
       (4096/(' || tile_y_max - tile_y || ')) as y_scale
),
 _geom as (
    select ST_Intersection(
        the_geom,
        $1
    ) as _clip_geom, properties as properties from (' || query || ') _wrap where the_geom && $2
)
select ST_AsGeoJSON(_clip_geom, 1) as geom, properties from _geom, _scale_conf where not ST_IsEmpty(_clip_geom) limit 1000000

';
-- RAISE NOTICE 'sql: %', sql;
RETURN QUERY EXECUTE sql USING envelope, buffered_envelope;

END;
$$ LANGUAGE plpgsql;



*/

module.exports = knex;
