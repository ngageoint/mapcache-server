var mongoose = require('mongoose')
  , CacheModel = require('../../models/cache')
  , config = require('mapcache-config');


var mongodbConfig = config.server.mongodb;

var mongoUri = "mongodb://" + mongodbConfig.host + "/" + mongodbConfig.db;
mongoose.connect(mongoUri, {server: {poolSize: mongodbConfig.poolSize}}, function(err) {
  if (err) {
    console.log('Error connecting to mongo database, please make sure mongodb is running...');
    throw err;
  }
});
mongoose.set('debug', true);

process.on('message', function(m) {
  console.log('got a message in child process', m);
  if(m.operation == 'generateCache') {
    generateCache(m.cache, m.format, m.minZoom, m.maxZoom);
  } else if (m.operation == 'restart') {
    restart(m.cache, m.format);
  } else if(m.operation == 'generateMoreZooms') {
    generateCache(m.cache, m.format, m.minZoom, m.maxZoom);
  } else if(m.operation == 'exit') {
    process.exit();
  }
});

function generateCache(cache, format, minZoom, maxZoom) {
  // TODO: doing this try catch isn't right and I will throw a 400 error soon
  var processor = null;
  try {
    processor = require('./' + format);
    CacheModel.getCacheById(cache.id, function(err, foundCache) {
      processor.generateCache(foundCache, minZoom, maxZoom, function(err, status) {
        console.log('creator status', status);
        if (!status || !status.cache) return process.exit();
        status.cache.status.complete = true;
        status.cache.save(function() {
          CacheModel.updateFormatCreated(status.cache, format, status.file, function(err) {
            process.exit();
          });
        });
      });
    });
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
        // Re-throw not "Module not found" errors
        throw e;
    }
  }
}

function generateMoreZooms(cache, format, minZoom, maxZoom) {
  var processor = null;
  try {
    processor = require('./' + format);
    CacheModel.getCacheById(cache.id, function(err, foundCache) {
      processor.generateMoreZooms(foundCache, minZoom, maxZoom, function(err, status) {
        console.log('creator status', status);
        if (!status || !status.cache) return process.exit();
        status.cache.status.complete = true;
        status.cache.save(function() {
          CacheModel.updateFormatCreated(status.cache, format, status.file, function(err) {
            process.exit();
          });
        });
      });
    });
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
        // Re-throw not "Module not found" errors
        throw e;
    }
  }
}

function restart(cache, format) {
  var processor = null;
  try {
    processor = require('./' + format);
    CacheModel.getCacheById(cache.id, function(err, foundCache) {
      processor.restart(foundCache, function(err, status) {
        console.log('creator status', status);
        if (!status || !status.cache) return process.exit();
        status.cache.status.complete = true;
        status.cache.save(function() {
          CacheModel.updateFormatCreated(status.cache, format, status.file, function(err) {
            process.exit();
          });
        });
      });
    });
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
        // Re-throw not "Module not found" errors
        throw e;
    }
  }
}
