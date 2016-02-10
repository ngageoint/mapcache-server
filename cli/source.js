var fs = require('fs-extra')
  , path = require('path')
  , api = require('../api')
  , knex = require('../mapcache-modules/models/db/knex')
  , async = require('async')
  , sources = require('../api/source');

exports.createSource = function(yargs) {
  var argv = yargs.usage('Creates a source.\nUsage: $0 createSource (-f <file> | -u <url>) -n <name> -t <type>')
  .option('f', {
    alias: 'file',
    description: 'path to file to create a source from'
  })
  .option('u', {
    alias: 'url',
    description: 'URL to create a source from'
  })
  .option('n', {
    alias: 'name',
    description: 'Name of the source',
    demand: true
  })
  .option('t', {
    alias: 'type',
    description: 'Type of source you are creating (xyz, shapefile etc.)',
    demand: true
  })
  .help('help')
  .argv;

  var source = {
    name: argv.n,
    format: argv.t
  };
  if (argv.f) {
    fs.copy(argv.f, '/tmp/' + path.basename(argv.f), function() {
      new api.Source(source).import({path: '/tmp/' + path.basename(argv.f)}, function(err, source) {
        setTimeout(sourceTimerFunction, 0, source);
      });
    });
  } else if (argv.u) {
    source.url = argv.u;
    api.Source.create(source, function(err, source) {
      setTimeout(sourceTimerFunction, 0, source);
    });
  } else {
    yargs.showHelp();
    console.log('One of -f or -u is required.');
    process.exit();
  }
};

exports.getSource = function(yargs) {
  var argv = yargs.usage('Gets a source.\nUsage: $0 getSourceById -i <id>')
    .option('i', {
      alias: 'id',
      description: 'ID of source to get',
      demand: true
    })
    .help('help')
    .argv;
  api.Source.getById(argv.i, function(err, source) {
    if (!source) {
      console.log('No source found.');
      process.exit();
    }
    console.log('Source:\n\tName:%s\n\tFormat:%s\n\tID:%s\n\tStatus:%s', source.name, source.format, source._id, source.status.message);
    process.exit();
  });
};

exports.getAllSources = function(yargs) {
  yargs.usage('Gets all sources.')
  .help('help');
  api.Source.getAll({}, function(err, sources) {
    if (sources.length === 0 ) {
      console.log("Found 0 sources.");
    }
    for (var i = 0; i < sources.length; i++) {
      var source = sources[i];
      console.log('Source:\n\tName:%s\n\tFormat:%s\n\tID:%s\n\tStatus:%s', source.name, source.format, source._id, source.status.message);
      for (var j = 0; j < source.dataSources.length; j++) {
        var dataSource = source.dataSources[j];
        console.log('\tDataSources:\n\t\tName:%s\n\t\tFormat:%s', dataSource.name, dataSource.format);
      }
    }
    process.exit();
  });
};

exports.deleteSource = function(yargs) {
  var argv = yargs.usage('Deletes a source.\nUsage: $0 deleteSource -i <id>')
    .option('i', {
      alias: 'id',
      description: 'ID of source to delete',
      demand: true
    })
    .help('help')
    .argv;
  api.Source.getById(argv.i, function(err, source) {
    api.Source(source).delete(function(err, source) {
      console.log('Deleted Source:\n\tName:%s\n\tFormat:%s\n\tID:%s\n\tStatus:%s', source.name, source.format, source._id, source.status.message);
      process.exit();
    });
  });
};

exports.getSourceTile = function(yargs) {
  var argv = yargs.usage('Gets a source tile.\nUsage: $0 getSourceTile [options]')
  .option('i', {
    alias: 'ID',
    description: 'ID of source',
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

  api.Source.getById(argv.i, function(err, source) {
    sources.getTile(source, argv.f, argv.z, argv.x, argv.y, {}, function(err, tileStream) {
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
};

exports.getSourceFeatures = function(yargs) {
  var argv = yargs.usage('Gets the features of the source in the given bounding box.\nUsage: $0 getSourceFeatures [options]')
  .option('i', {
    alias: 'ID',
    description: 'ID of source',
    demand: true
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
    alias: 'limit',
    description: 'limit the number of features'
  })
  .help('help')
  .argv;
  api.Source.getById(argv.i, function(err, source) {
    sources.getFeatures(source, argv.w, argv.s, argv.e, argv.n, 0, function(err, features) {
      if (err) {
        console.log('error retrieving features', err);
        process.exit();
      }
      if (!features) {
        console.log('No features were returned');
        process.exit();
      }
      console.log('Found ' + features.length + ' features:');
      for (var i = 0; i < features.length; i++) {
        console.log('Feature ' + i, features[i].properties);
      }
      process.exit();
    });
  });
};

exports.getSourceData = function(yargs) {
  var argv = yargs.usage('Gets the the source in the requested format.\nUsage: $0 getSourceData [options]')
  .option('i', {
    alias: 'ID',
    description: 'ID of source',
    demand: true
  })
  .option('f', {
    alias: 'format',
    nargs: 1,
    description: 'format to get the source in',
    demand: true
  })
  .option('o', {
    alias: 'outfile',
    nargs: 1,
    description: 'path to file to output the data into'
  })
  .help('help')
  .argv;
  api.Source.getById(argv.i, function(err, source) {
    sources.getData(source, argv.f, function(err, data) {
      if (err) {
        console.log('error retrieving data', err);
        process.exit();
      }
      if (!data) {
        console.log('No data was returned');
        process.exit();
      }

      if (argv.o) {
        var outstream = fs.createWriteStream(argv.o);
        outstream.on('finish', function() {
          console.log('data has been written to: ', argv.o);
          process.exit();
        });
        if (data.file) {
          console.log('streaming', data.file);
          fs.copy(data.file, argv.o, function() {
            process.exit();
          });
        } else if (data.stream) {
          data.stream.pipe(outstream);
        }
      }
    });
  });
};

exports.ingestMissingVectors = function(yargs) {
  yargs.usage('Ingests the maps with vector data not in postgres.\nUsage: $0 ingestMissingVectors [options]')
  .help('help');

  api.Source.getAll({}, function(err, mongoSources) {
    if (mongoSources.length === 0) {
      console.log("Found 0 sources.");
      return;
    }
    console.log('found ' + mongoSources.length + ' sources to look for');
    async.eachSeries(mongoSources, function iterator(source, callback) {
      console.log('looking for source in postgis', source);
      if (source.vector) {
        knex.select().where('source_id', source.id).from('features').then(function(postgisSources) {
          console.log('found source', postgisSources);
          if (postgisSources.length === 0) {
            sources.process(source, function() {
              callback();
            });
          } else {
            callback();
          }
        });
      } else {
        callback();
      }
    }, function done() {
      process.exit();
    });
  });
};

exports.reingestVectors = function(yargs) {
  var argv = yargs.usage('Reingests the map specified with vector data.\nUsage: $0 reingestVectors [options]')
  .option('i', {
    alias: 'ID',
    description: 'ID of source',
    demand: true
  })
  .help('help')
  .argv;

  api.Source.getById(argv.i, function() {

  });
};

function sourceTimerFunction(source) {
  api.Source.getById(source._id, function(err, source) {
    if (!source.status.complete) {
      console.log('Source is being created:\n\tName:%s\n\tFormat:%s\n\tID:%s\n\tStatus:%s', source.name, source.format, source._id, source.status.message);
      setTimeout(sourceTimerFunction, 5000, source);
    } else {
      console.log('Source was created:\n\tName:%s\n\tFormat:%s\n\tID:%s\n\tStatus:%s', source.name, source.format, source._id, source.status.message);
      process.exit();
    }
  });
}
