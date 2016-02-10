var util = require('util')
  , config = require('mapcache-config');

var transformCaches = function(caches) {
  return caches.map(function(cache) {
    var c = cache.toJSON({transform: true});
    updateCacheSource(c);
    return c;
  });
};

exports.transform = function(caches, options) {
  options = options || {};

  if (util.isArray(caches)) {
    return transformCaches(caches, options);
  }
  var cache = caches.toJSON({transform: true});
  updateCacheSource(cache);
  return cache;
};

function updateCacheSource(cache) {
  if (!cache.source) return;
  var addVectorSources = false;
  var addRasterSources = false;
  cache.source.cacheTypes = [];
  cache.source.dataSources.forEach(function(ds) {
    if (ds.vector) {
      addVectorSources = true;
      addRasterSources = true;
    } else {
      addRasterSources = true;
    }
  });
  if (addVectorSources) {
    var vectorTypes = config.sourceCacheTypes.vector;
    vectorTypes.forEach(function(type) {
      cache.source.cacheTypes.push(type);
    });
  }
  if (addRasterSources) {
    var rasterTypes = config.sourceCacheTypes.raster;
    rasterTypes.forEach(function(type) {
      cache.source.cacheTypes.push(type);
    });
  }
}
