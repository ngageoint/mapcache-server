var mongoose = require('mongoose')
  , SourceModel = require('../../models/source')
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
  if(m.operation == 'process') {
    processSource(m.sourceId);
  } else if(m.operation == 'exit') {
    process.exit();
  }
});

function processSource(sourceId) {
  SourceModel.getSourceById(sourceId, function(err, source) {
    if (!source) {
      console.log('unable to find source with id ', sourceId);
      process.exit();
    }
    var processor = require('./' + source.format);

    processor.processSource(source, function() {
      process.exit();
    });
  });
}
