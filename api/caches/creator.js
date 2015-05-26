var mongoose = require('mongoose')
  , CacheModel = require('../../models/cache')
  , config = require('../../config.json');


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
  } else if(m.operation == 'exit') {
    process.exit();
  }
});

function generateCache(cache, format, minZoom, maxZoom) {
  var processor = require('./' + format);

  CacheModel.getCacheById(cache.id, function(err, foundCache) {
    processor.generateCache(foundCache, minZoom, maxZoom, function(err, status) {
      status.cache.status.complete = true;
      CacheModel.updateFormatCreated(status.cache, format, status.file, function(err) {
        process.exit();
      });
    });
  });
}
