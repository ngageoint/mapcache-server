var gdalType = require('./gdalType');

var MrSID = function(config) {
  config = config || {};
  this.source = config.source;
  if (config.cache) {
    throw new Error('cannot create a MrSID cache at this time');
  }
}

MrSID.prototype.initialize = function() {
}

MrSID.prototype.processSource = function(doneCallback, progressCallback) {
  doneCallback = doneCallback || function() {};
  progressCallback = progressCallback || function(source, callback) { callback(null, source);};
  this.source.status = {};
  gdalType.processSource(this.source, doneCallback, progressCallback);
}

MrSID.prototype.getTile = function(format, z, x, y, params, callback) {
  gdalType.getTile(this.source, format, z, x, y, params, callback);
}

MrSID.prototype.generateCache = function(doneCallback, progressCallback) {
  doneCallback(null, null);
}

MrSID.prototype.getDataWithin = function(west, south, east, north, projection, callback) {
  callback(null, null);
}

module.exports = MrSID;
