var fs = require('fs-extra')
  , path = require('path')
  , api = require('../api')
  , turf = require('turf')
  , models = require('mapcache-models')
  , cacheModel = models.Cache
  , caches = require('../api/caches');

exports.getAllCaches = function(yargs) {
  var argv = yargs.usage('Gets all caches')
  .help('help')
  .argv;

console.log('api.Cache', api.Cache);
  api.Cache.getAll({}, function(err, caches) {
    if (err) {
      console.log('There was an error retrieving caches.');
      process.exit();
    }
    if (!caches) {
      console.log('No caches were found.');
      process.exit();
    }

    console.log('Found ' + caches.length + ' caches.');
    for (var i = 0; i < caches.length; i++) {
      console.log(caches[i]);
    }
    process.exit();
  });
}

exports.getCache = function(yargs) {
  var argv = yargs.usage('Gets a cache by id.\nUsage: $0 getCache -i <cache id>')
  .option('i', {
    alias: 'id',
    description: 'ID of cache'
  })
  .help('help')
  .argv;

  cacheModel.getCacheById(argv.i, function(err, cache) {
    if (!cache) {
      console.log('Cache ' + argv.i + ' not found');
      process.exit();
    }
    console.log('Cache:');
    console.log(cache);
    process.exit();
  });
}

exports.createCache = function(yargs) {
  var argv = yargs.usage('Creates a cache.\nUsage: $0 createCache [options]')
  .option('i', {
    alias: 'source',
    description: 'id of source to create cache from',
    demand: true
  })
  .option('t', {
    alias: 'name',
    description: 'Name of the cache',
    demand: true
  })
  .option('m', {
    alias: 'minZoom',
    description: 'Minimum zoom level of cache tiles'
  })
  .option('x', {
    alias: 'maxZoom',
    description: 'Maximum zoom level of cache tiles'
  })
  .option('f', {
    alias: 'format',
    description: 'Cache format to create'
  })
  .option('w', {
    alias: 'west',
    nargs: 1,
    description: 'west side of the bounding box',
    demand: true
  })
  .option('s', {
    alias: 'south',
    nargs: 1,
    description: 'south side of the bounding box',
    demand: true
  })
  .option('e', {
    alias: 'east',
    nargs: 1,
    description: 'east side of the bounding box',
    demand: true
  })
  .option('n', {
    alias: 'north',
    nargs: 1,
    description: 'north side of the bounding box',
    demand: true
  })
  .option('l', {
    alias: 'layer',
    nargs: 1,
    description: 'name of wms layer to use to create the cache'
  })
  .help('help')
  .argv;

  var geometry = turf.bboxPolygon([argv.w, argv.s, argv.e, argv.n]);

  var cache = {
    name: argv.t,
    geometry: geometry.geometry,
    source: {
      id: argv.i
    }
  };

  if (argv.m) {
    cache.minZoom = argv.m;
  }
  if (argv.x) {
    cache.maxZoom = argv.x;
  }

  if (argv.l != undefined) {
    cache.cacheCreationParams = {
      layer: argv.l
    };
  }

  new api.Cache().create(cache, argv.f, function(err, cache) {
    if (err) {
      console.log('Error creating the cache ', err);
      process.exit();
    }

    if (!cache) {
      console.log('Cache was not created');
      process.exit();
    }

    setTimeout(cacheTimerFunction, 0, cache);
  });
}

exports.generateFormat = function(yargs) {
  var argv = yargs.usage('Generates a cache format.\nUsage: $0 generateFormat [options]')
  .option('i', {
    alias: 'cache',
    description: 'id of cache to generate a format for',
    demand: true
  })
  .option('f', {
    alias: 'format',
    description: 'Cache format to generate',
    demand: true
  })
  .help('help')
  .argv;

  cacheModel.getCacheById(argv.i, function(err, cache) {
    if (!cache) {
      console.log("Cache does not exist");
      process.exit();
    }
    new api.Cache().create(cache, argv.f, function(err, cache) {
      if (err) {
        console.log('Error creating the cache format ', err);
        process.exit();
      }

      if (!cache) {
        console.log('Cache format was not created');
        process.exit();
      }

      setTimeout(cacheFormatTimerFunction, 0, cache, argv.f);
    });
  });
}

exports.restartFormat = function(yargs) {
  var argv = yargs.usage('Restarts a cache format generation.\nUsage: $0 restartFormat [options]')
  .option('i', {
    alias: 'cache',
    description: 'id of cache to generate a format for',
    demand: true
  })
  .option('f', {
    alias: 'format',
    description: 'Cache format to generate',
    demand: true
  })
  .help('help')
  .argv;

  cacheModel.getCacheById(argv.i, function(err, cache) {
    if (!cache) {
      console.log("Cache does not exist");
      process.exit();
    }
    new api.Cache().restart(cache, argv.f, function(err, cache) {
      if (err) {
        console.log('Error creating the cache format ', err);
        process.exit();
      }

      if (!cache) {
        console.log('Cache format was not created');
        process.exit();
      }

    });
    setTimeout(cacheFormatTimerFunction, 0, cache, argv.f);

  });
}

exports.generateMoreZooms = function(yargs) {
  var argv = yargs.usage('Adds more zooms to a cache format.\nUsage: $0 generateMoreZooms [options]')
  .option('i', {
    alias: 'cache',
    description: 'id of cache to generate zooms for',
    demand: true
  })
  .option('f', {
    alias: 'format',
    description: 'cache format to zoom',
    demand: true
  })
  .option('x', {
    alias: 'maxZoom',
    description: 'Maximum zoom level of cache tiles'
  })
  .option('m', {
    alias: 'minZoom',
    description: 'Minimum zoom level of cache tiles'
  })
  .help('help')
  .argv;

  cacheModel.getCacheById(argv.i, function(err, cache) {
    if (!cache) {
      console.log("Cache does not exist");
      process.exit();
    }
    new api.Cache().generateMoreZooms(cache, argv.f, argv.m, argv.x, function(err, cache) {
      if (err) {
        console.log('Error creating the cache format ', err);
        process.exit();
      }

      if (!cache) {
        console.log('Cache format was not created');
        process.exit();
      }

    });
    setTimeout(cacheFormatTimerFunction, 0, cache, argv.f);

  });
}

exports.getCacheTile = function(yargs) {
  var argv = yargs.usage('Gets a cache tile.\nUsage: $0 getCacheTile [options]')
  .option('i', {
    alias: 'id',
    description: 'ID of cache',
    demand: true
  })
  .option('x', {
    description: 'x of tile',
    demand: true
  })
  .option('y', {
    description: 'y of tile',
    demand: true
  })
  .option('z', {
    description: 'zoom level of tile',
    demand: true
  })
  .option('f', {
    alias: 'format',
    description: 'format of tile (png, json etc)',
    demand: true
  })
  .option('o', {
    alias: 'out',
    description: 'path to file to write tile to '
  })
  .help('help')
  .argv;

  cacheModel.getCacheById(argv.i, function(err, cache) {
    new api.Cache().getTile(cache, argv.f, argv.z, argv.x, argv.y, function(err, tileStream) {
      if (err) {
        console.log('Error getting tile');
        process.exit();
      }
      if (!tileStream) {
        console.log('Tile does not exist');
        process.exit();
      }

      if (argv.o) {
        var outstream = fs.createWriteStream(argv.o);
        outstream.on('finish', function() {
          console.log('Tile has been written to: ', argv.o);
          process.exit();
        });
        tileStream.pipe(outstream);
      } else {
        console.log('Found tile');
        tileStream.on('end', function() {
          process.exit();
        });
        tileStream.pipe(process.stdout);
      }
    });
  });
}

exports.exportCache = function(yargs) {
  var argv = yargs.usage('Exports a cache.\nUsage: $0 exportCache [options]')
  .option('i', {
    alias: 'id',
    description: 'ID of cache',
    demand: true
  })
  .option('x', {
    alias: 'maxZoom',
    description: 'max zoom of cache tiles'
  })
  .option('m', {
    alias: 'minZoom',
    description: 'min zoom of cache tiles'
  })
  .option('f', {
    alias: 'format',
    description: 'format of cache (geojson, xyz etc)',
    demand: true
  })
  .option('o', {
    alias: 'out',
    description: 'path to file to write cache to '
  })
  .help('help')
  .argv;

  cacheModel.getCacheById(argv.i, function(err, cache) {
    new api.Cache().getData(cache, argv.f, argv.m, argv.x, function(err, status) {
      if (err) {
        console.log('Error getting cache');
        process.exit();
      }
      if (!status) {
        console.log('Unable to export cache');
        process.exit();
      }

      if (argv.o) {
        var outstream = fs.createWriteStream(argv.o);
        outstream.on('finish', function() {
          console.log('Cache has been written to: ', argv.o);
          process.exit();
        });
        status.stream.pipe(outstream);
      } else {
        console.log('Found cache');
        status.stream.on('end', function() {
          process.exit();
        });
        status.stream.pipe(process.stdout);
      }
    });
  });
}

exports.deleteFormat = function(yargs) {
  var argv = yargs.usage('Deletes a cache format.\nUsage: $0 deleteFormat [options]')
  .option('i', {
    alias: 'id',
    description: 'ID of cache',
    demand: true
  })
  .option('f', {
    alias: 'format',
    description: 'format of cache (geojson, xyz etc)',
    demand: true
  })
  .help('help')
  .argv;

  cacheModel.getCacheById(argv.i, function(err, cache) {
    new api.Cache().deleteFormat(cache, argv.f, function(err) {
      if (err) {
        console.log('Error deleting format');
        process.exit();
      }
      console.log("Cache format %s has been deleted", argv.f);
      process.exit();
    });
  });
}

exports.deleteCache = function(yargs) {
  var argv = yargs.usage('Deletes a cache.\nUsage: $0 deleteFormat [options]')
  .option('i', {
    alias: 'id',
    description: 'ID of cache',
    demand: true
  })
  .help('help')
  .argv;

  cacheModel.getCacheById(argv.i, function(err, cache) {
    new api.Cache().delete(cache, function(err) {
      if (err) {
        console.log('Error deleting cache');
        process.exit();
      }
      console.log("Cache has been deleted");
      process.exit();
    });
  });
}

function cacheFormatTimerFunction(cache, format) {
  cacheModel.getCacheById(cache._id, function(err, cache) {
    if (!cache.formats[format]) {
      return setTimeout(cacheFormatTimerFunction, 5000, cache, format);
    }

    if (cache.formats[format].generating) {
      console.log('Cache format is being generated:\n\tName:%s\n\tFormat:%s\n\tFormat Size:%s\n\tID:%s\n\tGenerated Tiles:%s\n\tGenerated Features:%s', cache.name, format, cache.formats[format].size, cache._id, cache.status.generatedTiles, cache.status.generatedFeatures);
      setTimeout(cacheFormatTimerFunction, 5000, cache, format);
    } else {
      console.log('cache format was created:\n\tName:%s\n\tFormat:%s\n\tFormat Size:%s\n\tID:%s\n\tGenerated Tiles:%s\n\tGenerated Features:%s', cache.name, format, cache.formats[format].size, cache._id, cache.status.generatedTiles, cache.status.generatedFeatures);
      process.exit();
    }
  });

}

function cacheTimerFunction(cache) {
  cacheModel.getCacheById(cache._id, function(err, cache) {
    if (!cache.status.complete) {
      console.log('Cache is being created:\n\tName:%s\n\tID:%s\n\tGenerated Tiles:%s\n\tGenerated Features:%s', cache.name, cache._id, cache.status.generatedTiles, cache.status.generatedFeatures);
      setTimeout(cacheTimerFunction, 5000, cache);
    } else {
      console.log('cache was created:\n\tName:%s\n\tID:%s\n\tGenerated Tiles:%s\n\tGenerated Features:%s', cache.name, cache._id, cache.status.generatedTiles, cache.status.generatedFeatures);
      process.exit();
    }
  });
}
