exports.api = {
    "name": "Map Cache",
    "version": {
      "major": 1,
      "minor": 1,
      "micro": 0
    },
    "authentication": {
      "strategy": "local",
      "passwordMinLength": 14
    },
    "provision": {
      "strategy": "uid"
    }
  };
exports.server = {
    "token": {
      "expiration": 28800
    },
    "mongodb": {
      "host": "localhost",
      "port": 27017,
      "db": "mapcachedb",
      "poolSize": 5
    },
    "postgres": {
      "host": "127.0.0.1",
      "user": "postgres",
      "password": "postgres",
      "database": "mapcache"
    },
    "cacheDirectory": {
      "path": "/data/mapcache"
    },
    "sourceDirectory": {
      "path": "/data/mapcache/sources"
    },
    "storageLimit":20000,
    "maximumCacheSize":2048
  };
exports.sourceCacheTypes = {
    "vector": [{"type":"geojson", "required": false, "vector": true}, {"type":"shapefile", "required": false, "vector": true}, {"type":"kml", "required": false, "vector": true}, {"type":"geopackage", "required": false, "vector": true}],
    "raster": [{"type":"xyz", "required": false}, {"type":"tms", "required": false, "depends": "xyz"}, {"type":"mbtiles", "required": false}]
  };
