var mongoose = require('mongoose')
  , models = require('mapcache-models')
  , SourceModel = models.Source
  , config = require('mapcache-config');

var mongodbConfig = config.server.mongodb;

var mongoUri = "mongodb://" + mongodbConfig.host + "/" + mongodbConfig.db;
mongoose.connect(mongoUri, {server: {poolSize: mongodbConfig.poolSize}}, function(err) {
  if (err) {
    console.log('Error connecting to mongo database, please make sure mongodb is running...');
    throw err;
  }
});
mongoose.set('debug', false);

process.on('message', function(m) {
  console.log('got a message in child process', m);
  if(m.operation == 'process') {
    processSource(m.sourceId);
  } else if(m.operation == 'exit') {
    process.exit();
  }
});

function processSource(sourceId) {
  SourceModel.getDataSourceById(sourceId, function(err, source) {
    if (!source) {
      console.log('unable to find source with id ', sourceId);
      process.exit();
    }
    console.log('source with id ' + sourceId + ' is', source);
    var processor = require('./' + source.format);
    console.log('processing the ' + source.format + ' data source.');
    processor.processSource(source, function() {
      process.exit();
    });
  });
}
