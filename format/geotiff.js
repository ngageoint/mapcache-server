var gdalType = require('./gdalType');

var GeoTIFF = function(config) {
  config = config || {};
  this.source = config.source;
  if (config.cache) {
    throw new Error('cannot create a geotiff cache at this time');
  }
}

GeoTIFF.prototype.initialize = function() {
}

GeoTIFF.prototype.processSource = function(doneCallback, progressCallback) {
  doneCallback = doneCallback || function() {};
  progressCallback = progressCallback || function(source, callback) { callback(null, source);};
  this.source.status = this.source.status || {};
  gdalType.processSource(this.source, doneCallback, progressCallback);
}

GeoTIFF.prototype.getTile = function(format, z, x, y, params, callback) {
  gdalType.getTile(this.source, format, z, x, y, params, callback);
}

GeoTIFF.prototype.generateCache = function(doneCallback, progressCallback) {
  doneCallback(null, null);
}

GeoTIFF.prototype.getDataWithin = function(west, south, east, north, projection, callback) {
  callback(null, []);
}

module.exports = GeoTIFF;
