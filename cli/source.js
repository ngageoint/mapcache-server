// yargs
//   .alias('d', 'debug')
//   .alias('o', 'operation')
//   .alias('f', 'file')
//   .alias('n', 'name')
//   .alias('i', 'id')
//   .alias('t', 'type')
//   .alias('t', 'format')
//   .alias('w', 'outfile')
//   .alias('u', 'url')
//   .alias('s', 'style')
//   .help('help');


var fs = require('fs-extra')
  , path = require('path')
  , api = require('../api')
  , sources = require('../api/sources');

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
    fs.copy(argv.f, '/tmp/' + path.basename(argv.f), function(err) {
      new api.Source().import(source, {path: '/tmp/' + path.basename(argv.f)}, function(err, source) {
        setTimeout(sourceTimerFunction, 0, source);
      });
    });
  } else if (argv.u) {
    source.url = argv.u;
    new api.Source().create(source, function(err, source) {
      setTimeout(sourceTimerFunction, 0, source);
    });
  } else {
    yargs.showHelp();
    console.log('One of -f or -u is required.');
    process.exit();
  }
}

exports.getSourceById = function(yargs) {
  var argv = yargs.usage('Gets a source.\nUsage: $0 getSourceById -i <id>')
    .option('i', {
      alias: 'id',
      description: 'ID of source to get',
      demand: true
    })
    .help('help')
    .argv;
  new api.Source().getById(argv.i, function(err, source) {
    console.log('Source:\n\tName:%s\n\tFormat:%s\n\tID:%s\n\tStatus:%s', source.name, source.format, source._id, source.status.message);
    process.exit();
  });
}

exports.getAllSources = function(yargs) {
  var argv = yargs.usage('Gets all sources.')
  .help('help')
  .argv;
  new api.Source().getAll({}, function(err, sources) {
    for (var i = 0; i < sources.length; i++) {
      var source = sources[i];
      console.log('Source:\n\tName:%s\n\tFormat:%s\n\tID:%s\n\tStatus:%s', source.name, source.format, source._id, source.status.message);
    }
    process.exit();
  });
}

exports.deleteSourceById = function(yargs) {
  var argv = yargs.usage('Deletes a source.\nUsage: $0 deleteSourceById -i <id>')
    .option('i', {
      alias: 'id',
      description: 'ID of source to delete',
      demand: true
    })
    .help('help')
    .argv;
  new api.Source().getById(argv.i, function(err, source) {
    new api.Source().delete(source, function(err, source) {
      console.log('Deleted Source:\n\tName:%s\n\tFormat:%s\n\tID:%s\n\tStatus:%s', source.name, source.format, source._id, source.status.message);
      process.exit();
    });
  });
}

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

  new api.Source().getById(argv.i, function(err, source) {
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
}

exports.getSourceFeatures = function() {
  console.log('west', argv.west);
  new api.Source().getById(argv.id, function(err, source) {

  });
}

function sourceTimerFunction(source) {
  new api.Source().getById(source._id, function(err, source) {
    if (!source.status.complete) {
      console.log('Source is being created:\n\tName:%s\n\tFormat:%s\n\tID:%s\n\tStatus:%s', source.name, source.format, source._id, source.status.message);
      setTimeout(sourceTimerFunction, 5000, source);
    } else {
      console.log('Source was created:\n\tName:%s\n\tFormat:%s\n\tID:%s\n\tStatus:%s', source.name, source.format, source._id, source.status.message);
      process.exit();
    }
  });
}
