var GeoJSON = require('../../format/geojson')
  , should = require('chai').should()
  , fs = require('fs-extra')
  , path = require('path')
  , tile = require('mapcache-tile')
  , sinon = require('sinon')
  , mockfs = require('mock-fs')
  , mockKnex = require('mock-knex')
  , nock = require('nock')
  , mocks = require('../../mocks')
  , knexSetup = require('mapcache-models').knexSetup
  , knex = require('mapcache-models').knex;

describe('GeoJSON map create tests', function() {
  var sandbox;

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

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
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
    .onSecondCall().yieldsTo('response', [{count: ''+mocks.mapMocks.featureMock.length}]);

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
      source.status.totalFeatures.should.be.equal(mocks.mapMocks.featureMock.length);
      source.should.have.property('style');
      source.style.should.have.property('defaultStyle');
      source.style.should.have.property('styles');
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
    .onSecondCall().yieldsTo('response', [{count: ''+mocks.mapMocks.featureMock.length}]);

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
      source.status.totalFeatures.should.be.equal(mocks.mapMocks.featureMock.length);
      source.should.have.property('style');
      source.style.should.have.property('defaultStyle');
      source.style.should.have.property('styles');
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

  it('should return fast if already processed but the source is sparsely populated', function(done) {
    var tracker = mockKnex.getTracker();
    tracker.install();

    var mockQueryResponder = sinon.stub();
    var spy = sinon.spy(mockQueryResponder);
    tracker.on('query', mockQueryResponder);

    mockQueryResponder.withArgs(sinon.match({
      sql: 'select count(*) from "features" where "cache_id" is null and "source_id" = ?'
    }))
    .yieldsTo('response', [{count: ''+mocks.mapMocks.featureMock.length}]);

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
      source.status.totalFeatures.should.be.equal(mocks.mapMocks.featureMock.length);
      source.should.have.property('style');
      source.style.should.have.property('defaultStyle');
      source.style.should.have.property('styles');
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

  it('should return fast if already processed and the source already has all the information in it', function(done) {
    var dataSource = {
      "name":"geojson",
      "format":"geojson",
      "id": "geojson",
      "url": "http://localhost/geojsonfile",
      status: {
        complete: true,
        failure: false,
        totalFeatures: mocks.mapMocks.featureMock.length
      },
      properties: [{
        "key": "a",
        "values": [
          "b"
        ]
      }],
      geometry: {
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
      },
      style: {
        defaultStyle: {
          style: {
            'fill': "#000000",
            'fill-opacity': 0.5,
            'stroke': "#0000FF",
            'stroke-opacity': 1.0,
            'stroke-width': 1
          }
        },
        styles: []
      }
    };

    var geojson = new GeoJSON({source:dataSource});
    geojson.processSource(function(err, source) {
      should.not.exist(err);
      source.status.message.should.be.equal('Complete');
      source.status.complete.should.be.equal(true);
      source.status.failure.should.be.equal(false);
      source.status.totalFeatures.should.be.equal(mocks.mapMocks.featureMock.length);
      source.should.have.property('style');
      source.style.should.have.property('defaultStyle');
      source.style.should.have.property('styles');
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

  it('should get the 0/0/0 tile', function(done) {

    var mockMapcacheTile = sandbox.mock(tile);
    mockMapcacheTile.expects('getVectorTile').once().yields(null, fs.createReadStream(path.join('/mocks', 'zero_tile.png')));

    var dataSource = {
      "name":"geojson",
      "format":"geojson",
      "id": "geojson",
      "url": "http://localhost/geojsonfile",
      status: {
        complete: true,
        failure: false,
        totalFeatures: mocks.mapMocks.featureMock.length
      },
      properties: [{
        "key": "a",
        "values": [
          "b"
        ]
      }],
      geometry: {
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
      },
      style: {
        defaultStyle: {
          style: {
            'fill': "#000000",
            'fill-opacity': 0.5,
            'stroke': "#0000FF",
            'stroke-opacity': 1.0,
            'stroke-width': 1
          }
        },
        styles: []
      }
    };

    var geojson = new GeoJSON({source:dataSource});
    geojson.processSource(function(err, source) {
      should.not.exist(err);

      geojson.getTile('png', 0, 0, 0, null, function(err, tileStream) {
        tileStream.should.not.be.empty;
        done();
      });
    });
  });


});
