var fs = require('fs-extra')
  , path = require('path')
  , extend = require('util')._extend
  , shp2json = require('shp2json')
  , GeoJSON = require('./geojson')
  , log = require('mapcache-log');

var KMZ = function(config) {
  this.config = config || {};
  this.source = this.config.source;
  this.cache = this.config.cache;
  if (this.config.cache) {
    throw new Error('Cannot create KMZ caches at this time');
  }
}

KMZ.prototype.processSource = function(doneCallback, progressCallback) {
  var dir = this.config.outputDirectory || path.dirname(this.source.file.path);
  var fileName = path.basename(path.basename(this.source.file.path), path.extname(this.source.file.path)) + '.geojson';

  this.geoJsonFile = path.join(dir, fileName);
  if (fs.existsSync(this.geoJsonFile)) {
    log.info('Source is already processed and saved to %s', this.geoJsonFile);
    return doneCallback(null, this.source);
  }

  var kmzReadStream = fs.createReadStream(this.source.file.path);
  var geoJsonOutStream = fs.createOutputStream(this.geoJsonFile);

  var gj = "";
  var Transform = require('stream').Transform;

  var parser = new Transform();
  parser._transform = function(data, encoding, done) {
    console.log('data transforming');
    gj = gj + data.toString();
    this.push(data);
    done();
  };

  log.debug('parse shapefile to json');
  console.time('shape to json');

  geoJsonOutStream.on('close', this._finishedTransforming.bind(this, doneCallback, progressCallback));
  shp2json(kmzReadStream).pipe(parser).pipe(geoJsonOutStream);
}

KMZ.prototype._finishedTransforming = function(doneCallback, progressCallback, status) {
  console.timeEnd('shape to json');
  var geoJsonSource = extend({}, this.source);
  geoJsonSource.file = {
    path: this.geoJsonFile,
    name: path.basename(this.geoJsonFile)
  };
  this.geoJsonFormat = new GeoJSON({
    source: geoJsonSource
  });
  this.geoJsonFormat.processSource(doneCallback, progressCallback);
}

KMZ.prototype.getTile = function(format, z, x, y, params, callback) {
  this.geoJsonFormat.getTile(format, z, x, y, params, callback);
}

KMZ.prototype.generateCache = function(doneCallback, progressCallback) {
  doneCallback(null, null);
}

KMZ.prototype.getDataWithin = function(west, south, east, north, projection, callback) {
  this.geoJsonFormat.getDataWithin(west, south, east, north, projection, callback);
}

module.exports = KMZ;
