var GeoJSON = require('../../format/geojson')
  , should = require('chai').should()
  , fs = require('fs-extra')
  , path = require('path')
  , mockfs = require('mock-fs')
  , mockKnex = require('mock-knex')
  , mocks = require('../../mocks')
  , knexSetup = require('mapcache-models').knexSetup
  , knex = require('mapcache-models').knex;

describe('GeoJSON map create tests', function() {

  beforeEach(function(done) {
    mockKnex.mock(knexSetup.knex);
    knex(function() {
      fs.readFile(path.join(__dirname, '..','..','mocks','osm_0_0_0.png'), function (err, data) {
        mockfs({
          '/mocks':{
            'zero_tile.png': data,
            'features.geojson': JSON.stringify({
              "type": "FeatureCollection",
              "features": mocks.mapMocks.featureMock
            })
          }
        });
        done();
      });
    });
  });

  afterEach(function() {
    mockfs.restore();
    mockKnex.unmock(knexSetup.knex);
  });

  it('should create the format', function(done) {
    var tracker = mockKnex.getTracker();
    tracker.install();

    tracker.on('query', function checkResult(query) {
      if (query.sql === 'select count(*) from "features" where "cache_id" is null and "source_id" = ?') {
        query.response([{count: '0'}]);
      } else if (query.sql === 'select ST_AsGeoJSON(ST_Transform(ST_SetSRID(ST_Extent(geometry), 3857), 4326)) as extent from "features" where "source_id" = ? and "cache_id" is null'){
        query.bindings[0].should.be.equal('geojson');
        query.response([{extent: '{"type": "Polygon","coordinates": [[[28,58],[28,57.5],[28.5,57.5],[28.5,58],[28,58]]]}'}]);
      } else if (query.sql === 'select distinct json_object_keys(properties) as property from "features" where "cache_id" is null and "source_id" = ?') {
        query.response([{
          property: 'a'
        }]);
      } else if (query.sql === 'select distinct json_object_keys(properties) as property from "features" where "cache_id" is null and "source_id" = ?') {
        query.response([{
          property: 'a'
        }]);
      } else if (query.sql === 'select distinct properties::jsonb -> \'a\' as value from "features" where "cache_id" is null and "source_id" = ? and properties::jsonb\\?|array[\'a\']') {
        query.response([{
          value: 'b'
        }]);
      } else {
        query.response({rows:[]});
      }
    });

    var dataSource = {
      "name":"geojson",
      "format":"geojson",
      "id": "geojson",
      "file": {
        "path": '/mocks/features.geojson',
        "name": 'features.geojson'
      }
    };
    var geojson = new GeoJSON({source:dataSource});
    geojson.processSource(function(err, source) {
      should.not.exist(err);
      source.status.message.should.be.equal('Complete');
      source.status.complete.should.be.equal(true);
      source.status.failure.should.be.equal(false);
      source.properties[0].should.be.deep.equal({
        "key": "a",
        "values": [
          "b"
        ]
      });
      source.geometry.should.be.deep.equal({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[
            [28,58],
            [28,57.5],
            [28.5,57.5],
            [28.5,58],
            [28,58]
          ]]
        }
      });
      done();
    });
  });
});
