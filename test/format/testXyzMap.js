var XYZ = require('../../format/xyz')
  , should = require('chai').should()
  , fs = require('fs-extra')
  , path = require('path')
  , nock = require('nock')
  , mockfs = require('mock-fs')
  , mocks = require('../../mocks');

describe('XYZ map create tests', function() {
  it('should create the format', function(done) {
    var source = mocks.mapMocks.osmDatasource;
    var xyz = new XYZ({source:source});
    xyz.processSource(function(err, source) {
      should.not.exist(err);
      source.status.message.should.be.equal('Complete');
      source.status.complete.should.be.equal(true);
      source.status.failure.should.be.equal(false);
      source.geometry.should.be.deep.equal({
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [[
            [180, -85],
            [-180, -85],
            [-180, 85],
            [180, 85],
            [180, -85]
          ]]
        }
      });
      done();
    });
  });
});

describe('XYZ map tests', function() {

  var xyz;

  beforeEach(function(done) {
    var source = mocks.mapMocks.osmDatasource;
    xyz = new XYZ({source:source});
    xyz.processSource(function() {
      done();
    });
  });

  beforeEach(function(done) {
    fs.readFile(path.join(__dirname, '..','..','mocks','osm_0_0_0.png'), function (err, data) {
      mockfs({
        '/mocks':{
          'zero_tile.png': data
        }
      });
      done();
    });

  });

  afterEach(function() {
    mockfs.restore();
  });

  it('should get the 0/0/0 tile', function(done) {

    var mockedHttp = nock(mocks.mapMocks.osmDatasource.url).get('/0/0/0.png').reply(200, function(uri, requestBody) {
      return fs.createReadStream(path.join('/mocks', 'zero_tile.png'));
    });
    xyz.getTile('png', 0, 0, 0, null, function(err, tileRequest) {
      tileRequest.should.not.be.empty;
      mockedHttp.isDone();
      done();
    });
  });
});
