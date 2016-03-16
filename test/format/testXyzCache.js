var XYZ = require('../../format/xyz')
  , Cache = require('../../cache/cache')
  , fs = require('fs-extra')
  , os = require('os')
  , path = require('path')
  , sinon = require('sinon')
  , nock = require('nock')
  , mockfs = require('mock-fs')
  , mocks = require('../../mocks');

describe('XYZ cache tests', function() {

  var xyz;
  var mockCache = mocks.cacheMocks.osmCache;

  var sandbox;
  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  beforeEach(function(done) {
    var cacheDir = path.join(os.tmpdir(), mockCache.id.toString(), 'xyztiles', '1', '0');
    var mockConfig = { };

    fs.readFile(path.join(__dirname, '..','..','mocks','osm_0_0_0.png'), function (err, data) {
      mockConfig['/mocks'] = {
        'zero_tile.png': data
      };
      mockConfig[cacheDir] = {
        '0.png': data
      };
      mockfs(mockConfig);
      done();
    });

  });

  afterEach(function() {
    mockfs.restore();
  });

  beforeEach(function(done) {
    var cacheModel = JSON.parse(JSON.stringify(mockCache));
    cacheModel.outputDirectory = os.tmpdir();

    var cache = new Cache(cacheModel);

    xyz = new XYZ({cache:cache, outputDirectory: os.tmpdir()});
    done();
  });

  it('should create the format', function() {
    var cache = mockCache;
    var xyz = new XYZ({cache: cache, outputDirectory: os.tmpdir()});
  });

  it('should get the 0/0/0 tile from the url', function(done) {
    var mockedHttp = nock(mockCache.source.dataSources[0].url).get('/0/0/0.png').reply(200, fs.createReadStream(path.join('/mocks', 'zero_tile.png')));
    xyz.getTile('png', 0, 0, 0, null, function(err, tileRequest) {
      tileRequest.should.not.be.empty;
      mockedHttp.isDone();
      done();
    });
  });

  it('should get the 1/0/0 tile from the file system', function(done) {
    xyz.getTile('png', 1, 0, 0, null, function(err, tileRequest) {
      tileRequest.should.not.be.empty;
      done();
    });
  });

  it('should get the 1/0/0 tile from the url because it should not be cached', function(done) {
    var mockedHttp = nock(mockCache.source.dataSources[0].url).get('/1/0/0.png').reply(200, fs.createReadStream(path.join('/mocks', 'zero_tile.png')));
    xyz.getTile('png', 1, 0, 0, {noCache: true}, function(err, tileRequest) {
      tileRequest.should.not.be.empty;
      mockedHttp.isDone();
      done();
    });
  });

  it('should generate the cache', function(done) {
    var httpMocks = [];
    httpMocks.push(nock(mockCache.source.dataSources[0].url).get('/0/0/0.png').reply(200, fs.createReadStream(path.join('/mocks', 'zero_tile.png'))));
    httpMocks.push(nock(mockCache.source.dataSources[0].url).get('/1/0/0.png').reply(200, fs.createReadStream(path.join('/mocks', 'zero_tile.png'))));
    httpMocks.push(nock(mockCache.source.dataSources[0].url).get('/1/0/1.png').reply(200, fs.createReadStream(path.join('/mocks', 'zero_tile.png'))));
    httpMocks.push(nock(mockCache.source.dataSources[0].url).get('/1/1/0.png').reply(200, fs.createReadStream(path.join('/mocks', 'zero_tile.png'))));
    httpMocks.push(nock(mockCache.source.dataSources[0].url).get('/1/1/1.png').reply(200, fs.createReadStream(path.join('/mocks', 'zero_tile.png'))));

    xyz.generateCache(function(err, finishedCache) {
      var cacheModel = finishedCache.cache;
      cacheModel.should.have.property('name', 'createXyzCache');
      cacheModel.formats.should.have.property('xyz');
      var xyz = cacheModel.formats.xyz;
      xyz.should.have.property('totalTiles', 5);
      xyz.should.have.property('percentComplete', 100);
      xyz.should.have.property('complete', true);
      xyz.should.have.property('generatedTiles', 5);
      xyz.zoomLevelStatus.should.have.length(2);
      var zoom = xyz.zoomLevelStatus[0];
      zoom.should.have.property('totalTiles', 1);
      zoom.should.have.property('percentComplete', 100);
      zoom.should.have.property('complete', true);
      zoom.should.have.property('generatedTiles', 1);
      zoom = xyz.zoomLevelStatus[1];
      zoom.should.have.property('totalTiles', 4);
      zoom.should.have.property('percentComplete', 100);
      zoom.should.have.property('complete', true);
      zoom.should.have.property('generatedTiles', 4);
      for (var i = 0; i < httpMocks.length; i++) {
        httpMocks[i].isDone();
      }
      fs.stat(path.join(os.tmpdir(), mockCache.id.toString(), 'xyztiles', '0', '0', '0.png'), function(err, stats) {
        stats.isFile().should.be.equal(true);
        done();
      });
    }, function(cacheProgress, callback) {
      callback(null, cacheProgress);
    });
  });

  it('should download the cache', function(done) {
    var httpMocks = [];
    httpMocks.push(nock(mockCache.source.dataSources[0].url).get('/0/0/0.png').reply(200, fs.createReadStream(path.join('/mocks', 'zero_tile.png'))));
    httpMocks.push(nock(mockCache.source.dataSources[0].url).get('/1/0/0.png').reply(200, fs.createReadStream(path.join('/mocks', 'zero_tile.png'))));
    httpMocks.push(nock(mockCache.source.dataSources[0].url).get('/1/0/1.png').reply(200, fs.createReadStream(path.join('/mocks', 'zero_tile.png'))));
    httpMocks.push(nock(mockCache.source.dataSources[0].url).get('/1/1/0.png').reply(200, fs.createReadStream(path.join('/mocks', 'zero_tile.png'))));
    httpMocks.push(nock(mockCache.source.dataSources[0].url).get('/1/1/1.png').reply(200, fs.createReadStream(path.join('/mocks', 'zero_tile.png'))));

    xyz.generateCache(function(err, finishedCache) {
      var cacheModel = finishedCache.cache;
      cacheModel.should.have.property('name', 'createXyzCache');
      cacheModel.formats.should.have.property('xyz');
      var xyzFormat = cacheModel.formats.xyz;
      xyzFormat.should.have.property('totalTiles', 5);
      xyzFormat.should.have.property('percentComplete', 100);
      xyzFormat.should.have.property('complete', true);
      xyzFormat.should.have.property('generatedTiles', 5);
      xyzFormat.zoomLevelStatus.should.have.length(2);
      var zoom = xyzFormat.zoomLevelStatus[0];
      zoom.should.have.property('totalTiles', 1);
      zoom.should.have.property('percentComplete', 100);
      zoom.should.have.property('complete', true);
      zoom.should.have.property('generatedTiles', 1);
      zoom = xyzFormat.zoomLevelStatus[1];
      zoom.should.have.property('totalTiles', 4);
      zoom.should.have.property('percentComplete', 100);
      zoom.should.have.property('complete', true);
      zoom.should.have.property('generatedTiles', 4);
      for (var i = 0; i < httpMocks.length; i++) {
        httpMocks[i].isDone();
      }

      xyz.getData(mockCache.minZoom, mockCache.maxZoom, function(err, dataResult) {
        dataResult.should.have.property('stream');
        dataResult.should.have.property('extension', '.zip');
        done();
      });
    }, function(cacheProgress, callback) {
      callback(null, cacheProgress);
    });
  });

  it('should delete the cache', function(done) {
    var httpMocks = [];
    httpMocks.push(nock(mockCache.source.dataSources[0].url).get('/0/0/0.png').reply(200, fs.createReadStream(path.join('/mocks', 'zero_tile.png'))));
    httpMocks.push(nock(mockCache.source.dataSources[0].url).get('/1/0/0.png').reply(200, fs.createReadStream(path.join('/mocks', 'zero_tile.png'))));
    httpMocks.push(nock(mockCache.source.dataSources[0].url).get('/1/0/1.png').reply(200, fs.createReadStream(path.join('/mocks', 'zero_tile.png'))));
    httpMocks.push(nock(mockCache.source.dataSources[0].url).get('/1/1/0.png').reply(200, fs.createReadStream(path.join('/mocks', 'zero_tile.png'))));
    httpMocks.push(nock(mockCache.source.dataSources[0].url).get('/1/1/1.png').reply(200, fs.createReadStream(path.join('/mocks', 'zero_tile.png'))));

    xyz.generateCache(function(err, finishedCache) {
      var cacheModel = finishedCache.cache;
      cacheModel.should.have.property('name', 'createXyzCache');
      cacheModel.formats.should.have.property('xyz');
      var xyzFormat = cacheModel.formats.xyz;
      xyzFormat.should.have.property('totalTiles', 5);
      xyzFormat.should.have.property('percentComplete', 100);
      xyzFormat.should.have.property('complete', true);
      xyzFormat.should.have.property('generatedTiles', 5);
      xyzFormat.zoomLevelStatus.should.have.length(2);
      var zoom = xyzFormat.zoomLevelStatus[0];
      zoom.should.have.property('totalTiles', 1);
      zoom.should.have.property('percentComplete', 100);
      zoom.should.have.property('complete', true);
      zoom.should.have.property('generatedTiles', 1);
      zoom = xyzFormat.zoomLevelStatus[1];
      zoom.should.have.property('totalTiles', 4);
      zoom.should.have.property('percentComplete', 100);
      zoom.should.have.property('complete', true);
      zoom.should.have.property('generatedTiles', 4);
      for (var i = 0; i < httpMocks.length; i++) {
        httpMocks[i].isDone();
      }
      fs.stat(path.join(os.tmpdir(), mockCache.id.toString(), 'xyztiles', '0', '0', '0.png'), function(err, stats) {
        stats.isFile().should.be.equal(true);
        xyz.delete(function() {
          fs.stat(path.join(os.tmpdir(), mockCache.id.toString(), 'xyztiles'), function(err, stats) {
            err.should.have.property('errno', 34);
            done();
          });
        });
      });
    }, function(cacheProgress, callback) {
      callback(null, cacheProgress);
    });
  });
});
