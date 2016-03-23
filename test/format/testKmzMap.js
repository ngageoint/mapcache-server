var KMZ = require('../../format/kmz')
  , should = require('chai').should()
  , fs = require('fs-extra')
  , path = require('path')
  , Readable = require('stream').Readable
  , tile = require('mapcache-tile')
  , sinon = require('sinon')
  , mockfs = require('mock-fs')
  , mockKnex = require('mock-knex')
  , nock = require('nock')
  , gdal = require('gdal')
  , ogr2ogr = require('ogr2ogr')
  , mocks = require('../../mocks')
  , knexSetup = require('mapcache-models').knexSetup
  , knex = require('mapcache-models').knex;

describe('KMZ map create tests', function() {
  var sandbox;
  var tracker;

  beforeEach(function(done) {
    mockKnex.mock(knexSetup.knex);
    knex(function() {
      mockfs({
        '/mocks':{
          'zero_tile.png': fs.readFileSync(path.join(__dirname, '..', '..', 'mocks', 'osm_0_0_0.png')),
          'features.kmz': fs.readFileSync(path.join(__dirname, '..', '..', 'mocks', 'test.kmz'))
        }
      });
      tracker = mockKnex.getTracker();
      tracker.install();
      done();
    });
  });

  afterEach(function() {
    mockfs.restore();
    tracker.uninstall();
    mockKnex.unmock(knexSetup.knex);
  });

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('should create the format', function(done) {
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

    var mockGdal = sandbox.mock(gdal);
    mockGdal.expects('open').once().returns({
      layers: {
        count: function() {
          return 1;
        },
        get: function() {
          return {
            name: 'one'
          };
        }
      }
    });


    var rs = new Readable();
    rs.push(JSON.stringify({type:"FeatureCollection", features:mocks.mapMocks.featureMock}));
    rs.push(null);

    var mockOgr = sandbox.mock(ogr2ogr.prototype);
    mockOgr.expects('stream').once().returns(rs);

    var dataSource = {
      "name":"kmz",
      "format":"kmz",
      "id": "geojson",
      "file": {
        "path": '/mocks/features.kmz',
        "name": 'features.kmz'
      }
    };
    var kmz = new KMZ({source:dataSource});
    sandbox.stub(kmz, '_findKmlFile', function(kmz, callback) {
      callback(null, '/mocks/features.kml');
    });
    kmz.processSource(function(err, source) {
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

  it('should create the format from kml', function(done) {
    var mockQueryResponder = sinon.stub();
    tracker.on('query', mockQueryResponder);

    mockQueryResponder.withArgs(sinon.match({
      sql: 'select count(*) from "features" where "cache_id" is null and "source_id" = ?'
    }))
    .onFirstCall().yieldsTo('response', [{count: '0'}])
    .onSecondCall().yieldsTo('response', [{count: ''+mocks.mapMocks.featureMock.length}]);

    mockQueryResponder.withArgs(sinon.match({
      sql: 'select ST_AsGeoJSON(ST_Transform(ST_SetSRID(ST_Extent(geometry), 3857), 4326)) as extent from "features" where "source_id" = ? and "cache_id" is null',
      bindings: ['kml']
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

    var mockGdal = sandbox.mock(gdal);
    mockGdal.expects('open').once().returns({
      layers: {
        count: function() {
          return 1;
        },
        get: function() {
          return {
            name: 'one'
          };
        }
      }
    });


    var rs = new Readable();
    rs.push(JSON.stringify({type:"FeatureCollection", features:mocks.mapMocks.featureMock}));
    rs.push(null);

    var mockOgr = sandbox.mock(ogr2ogr.prototype);
    mockOgr.expects('stream').once().returns(rs);

    var dataSource = {
      "name":"kml",
      "format":"kmz",
      "id": "kml",
      "file": {
        "path": '/mocks/features.kml',
        "name": 'features.kml'
      }
    };
    var kmz = new KMZ({source:dataSource});
    kmz.processSource(function(err, source) {
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

  // it('should create the format from a url', function(done) {
  //   var tracker = mockKnex.getTracker();
  //   tracker.install();
  //   var mockQueryResponder = sinon.stub();
  //   tracker.on('query', mockQueryResponder);
  //
  //   mockQueryResponder.withArgs(sinon.match({
  //     sql: 'select count(*) from "features" where "cache_id" is null and "source_id" = ?'
  //   }))
  //   .onFirstCall().yieldsTo('response', [{count: '0'}])
  //   .onSecondCall().yieldsTo('response', [{count: ''+mocks.mapMocks.featureMock.length}]);
  //
  //   mockQueryResponder.withArgs(sinon.match({
  //     sql: 'select ST_AsGeoJSON(ST_Transform(ST_SetSRID(ST_Extent(geometry), 3857), 4326)) as extent from "features" where "source_id" = ? and "cache_id" is null',
  //     bindings: ['geojson']
  //   })).yieldsTo('response', [{extent: '{"type": "Polygon","coordinates": [[[28,58],[28,57.5],[28.5,57.5],[28.5,58],[28,58]]]}'}]);
  //
  //   mockQueryResponder.withArgs(sinon.match({
  //     sql: 'select distinct json_object_keys(properties) as property from "features" where "cache_id" is null and "source_id" = ?'
  //   })).yieldsTo('response', [{
  //     property: 'a'
  //   }]);
  //
  //   mockQueryResponder.withArgs(sinon.match({
  //     sql: 'select distinct properties::jsonb -> \'a\' as value from "features" where "cache_id" is null and "source_id" = ? and properties::jsonb\\?|array[\'a\']'
  //   })).yieldsTo('response', [{
  //     value: 'b'
  //   }]);
  //
  //   mockQueryResponder.withArgs(sinon.match({
  //     method: 'insert'
  //   })).yieldsTo('response', []);
  //
  //   mockQueryResponder.withArgs(sinon.match({
  //     method: 'select'
  //   })).yieldsTo('response', []);
  //
  //   var dataSource = {
  //     "name":"geojson",
  //     "format":"geojson",
  //     "id": "geojson",
  //     "url": "http://localhost/geojsonfile"
  //   };
  //
  //   var mockedHttp = nock('http://localhost').get('/geojsonfile').reply(200, JSON.stringify({
  //     "type": "FeatureCollection",
  //     "features": mocks.mapMocks.featureMock
  //   }));
  //
  //   var geojson = new GeoJSON({source:dataSource});
  //   geojson.processSource(function(err, source) {
  //     should.not.exist(err);
  //     source.status.message.should.be.equal('Complete');
  //     source.status.complete.should.be.equal(true);
  //     source.status.failure.should.be.equal(false);
  //     source.status.totalFeatures.should.be.equal(mocks.mapMocks.featureMock.length);
  //     source.should.have.property('style');
  //     source.style.should.have.property('defaultStyle');
  //     source.style.should.have.property('styles');
  //     source.properties[0].should.be.deep.equal({
  //       "key": "a",
  //       "values": [
  //         "b"
  //       ]
  //     });
  //     source.geometry.should.be.deep.equal({
  //       type: "Feature",
  //       geometry: {
  //         type: "Polygon",
  //         coordinates: [[
  //           [28,58],
  //           [28,57.5],
  //           [28.5,57.5],
  //           [28.5,58],
  //           [28,58]
  //         ]]
  //       }
  //     });
  //     mockedHttp.isDone();
  //     done();
  //   });
  // });

  it('should return fast if already processed but the source is sparsely populated', function(done) {

    var mockQueryResponder = sinon.stub();
    tracker.on('query', mockQueryResponder);

    mockQueryResponder.withArgs(sinon.match({
      sql: 'select count(*) from "features" where "cache_id" is null and "source_id" = ?'
    }))
    .yieldsTo('response', [{count: ''+mocks.mapMocks.featureMock.length}]);

    mockQueryResponder.withArgs(sinon.match({
      sql: 'select ST_AsGeoJSON(ST_Transform(ST_SetSRID(ST_Extent(geometry), 3857), 4326)) as extent from "features" where "source_id" = ? and "cache_id" is null',
      bindings: ['kmz']
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
      "name":"kmz",
      "format":"kmz",
      "id": "kmz",
      "file": {
        "path": '/mocks/features.kmz',
        "name": 'features.kmz'
      }
    };

    var kmz = new KMZ({source:dataSource});
    kmz.processSource(function(err, source) {
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

  it('should return fast if already processed and the source already has all the information in it', function(done) {
    var dataSource = {
      "name":"geojson",
      "format":"geojson",
      "id": "geojson",
      "file": {
        "path": '/mocks/features.kmz',
        "name": 'features.kmz'
      },
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

    var kmz = new KMZ({source:dataSource});
    kmz.processSource(function(err, source) {
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
      "name":"kmz",
      "format":"kmz",
      "id": "kmz",
      "file": {
        "path": '/mocks/features.kmz',
        "name": 'features.kmz'
      },
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

    var kmz = new KMZ({source:dataSource});
    kmz.processSource(function(err, source) {
      should.not.exist(err);

      kmz.getTile('png', 0, 0, 0, null, function(err, tileStream) {
        tileStream.should.not.be.empty;
        done();
      });
    });
  });


});
