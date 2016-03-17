var GeoJSON = require('../../format/geojson')
  , should = require('chai').should()
  , fs = require('fs-extra')
  , path = require('path')
  , sinon = require('sinon')
  , mockfs = require('mock-fs')
  , mockKnex = require('mock-knex')
  , nock = require('nock')
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

    var mockQueryResponder = sinon.stub();
    tracker.on('query', mockQueryResponder);

    mockQueryResponder.withArgs(sinon.match({
      sql: 'select count(*) from "features" where "cache_id" is null and "source_id" = ?'
    }))
    .onFirstCall().yieldsTo('response', [{count: '0'}])
    .onSecondCall().yieldsTo('response', [{count: '100'}]);

    mockQueryResponder.withArgs(sinon.match({
      sql: 'select ST_AsGeoJSON(ST_Transform(ST_SetSRID(ST_Extent(geometry), 3857), 4326)) as extent from "features" where "source_id" = ? and "cache_id" is null',
      bindings: ['geojson']
    })).yieldsTo('response', [{extent: '{"type": "Polygon","coordinates": [[[28,58],[28,57.5],[28.5,57.5],[28.5,58],[28,58]]]}'}]);

    mockQueryResponder.withArgs(sinon.match({
      sql: 'select distinct json_object_keys(properties) as property from "features" where "cache_id" is null and "source_id" = ?'
    })).yieldsTo('response', [{
      property: 'a'
    }]);

    mockQueryResponder.withArgs(sinon.match({
      sql: 'select distinct properties::jsonb -> \'a\' as value from "features" where "cache_id" is null and "source_id" = ? and properties::jsonb\\?|array[\'a\']'
    })).yieldsTo('response', [{
      value: 'b'
    }]);

    mockQueryResponder.withArgs(sinon.match({
      method: 'insert'
    })).yieldsTo('response', []);

    mockQueryResponder.withArgs(sinon.match({
      method: 'select'
    })).yieldsTo('response', []);

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
      source.status.totalFeatures.should.be.equal(100);
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

  it('should create the format from a url', function(done) {
    var tracker = mockKnex.getTracker();
    tracker.install();
    var mockQueryResponder = sinon.stub();
    tracker.on('query', mockQueryResponder);

    mockQueryResponder.withArgs(sinon.match({
      sql: 'select count(*) from "features" where "cache_id" is null and "source_id" = ?'
    }))
    .onFirstCall().yieldsTo('response', [{count: '0'}])
    .onSecondCall().yieldsTo('response', [{count: '100'}]);

    mockQueryResponder.withArgs(sinon.match({
      sql: 'select ST_AsGeoJSON(ST_Transform(ST_SetSRID(ST_Extent(geometry), 3857), 4326)) as extent from "features" where "source_id" = ? and "cache_id" is null',
      bindings: ['geojson']
    })).yieldsTo('response', [{extent: '{"type": "Polygon","coordinates": [[[28,58],[28,57.5],[28.5,57.5],[28.5,58],[28,58]]]}'}]);

    mockQueryResponder.withArgs(sinon.match({
      sql: 'select distinct json_object_keys(properties) as property from "features" where "cache_id" is null and "source_id" = ?'
    })).yieldsTo('response', [{
      property: 'a'
    }]);

    mockQueryResponder.withArgs(sinon.match({
      sql: 'select distinct properties::jsonb -> \'a\' as value from "features" where "cache_id" is null and "source_id" = ? and properties::jsonb\\?|array[\'a\']'
    })).yieldsTo('response', [{
      value: 'b'
    }]);

    mockQueryResponder.withArgs(sinon.match({
      method: 'insert'
    })).yieldsTo('response', []);

    mockQueryResponder.withArgs(sinon.match({
      method: 'select'
    })).yieldsTo('response', []);

    var dataSource = {
      "name":"geojson",
      "format":"geojson",
      "id": "geojson",
      "url": "http://localhost/geojsonfile"
    };

    var mockedHttp = nock('http://localhost').get('/geojsonfile').reply(200, JSON.stringify({
      "type": "FeatureCollection",
      "features": mocks.mapMocks.featureMock
    }));

    var geojson = new GeoJSON({source:dataSource});
    geojson.processSource(function(err, source) {
      should.not.exist(err);
      source.status.message.should.be.equal('Complete');
      source.status.complete.should.be.equal(true);
      source.status.failure.should.be.equal(false);
      source.status.totalFeatures.should.be.equal(100);
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
      mockedHttp.isDone();
      done();
    });
  });

  it('should return fast if already processed', function(done) {
    var tracker = mockKnex.getTracker();
    tracker.install();

    var mockQueryResponder = sinon.stub();
    var spy = sinon.spy(mockQueryResponder);
    tracker.on('query', mockQueryResponder);

    mockQueryResponder.withArgs(sinon.match({
      sql: 'select count(*) from "features" where "cache_id" is null and "source_id" = ?'
    }))
    .yieldsTo('response', [{count: '100'}]);

    mockQueryResponder.withArgs(sinon.match({
      sql: 'select ST_AsGeoJSON(ST_Transform(ST_SetSRID(ST_Extent(geometry), 3857), 4326)) as extent from "features" where "source_id" = ? and "cache_id" is null',
      bindings: ['geojson']
    })).yieldsTo('response', [{extent: '{"type": "Polygon","coordinates": [[[28,58],[28,57.5],[28.5,57.5],[28.5,58],[28,58]]]}'}]);

    mockQueryResponder.withArgs(sinon.match({
      sql: 'select distinct json_object_keys(properties) as property from "features" where "cache_id" is null and "source_id" = ?'
    })).yieldsTo('response', [{
      property: 'a'
    }]);

    mockQueryResponder.withArgs(sinon.match({
      sql: 'select distinct properties::jsonb -> \'a\' as value from "features" where "cache_id" is null and "source_id" = ? and properties::jsonb\\?|array[\'a\']'
    })).yieldsTo('response', [{
      value: 'b'
    }]);

    mockQueryResponder.withArgs(sinon.match({
      method: 'insert'
    })).yieldsTo('response', []);

    mockQueryResponder.withArgs(sinon.match({
      method: 'select'
    })).yieldsTo('response', []);
    var dataSource = {
      "name":"geojson",
      "format":"geojson",
      "id": "geojson",
      "url": "http://localhost/geojsonfile"
    };

    var geojson = new GeoJSON({source:dataSource});
    geojson.processSource(function(err, source) {
      should.not.exist(err);
      source.status.message.should.be.equal('Complete');
      source.status.complete.should.be.equal(true);
      source.status.failure.should.be.equal(false);
      source.status.totalFeatures.should.be.equal(100);
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
      console.log('spy.callCount', spy.callCount);
      done();
    });
  });


});
