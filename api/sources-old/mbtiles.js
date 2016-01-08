var models = require('mapcache-models')
  , SourceModel = models.Source
  , exec = require('child_process').exec
  , config = require('mapcache-config')
  , fs = require('fs-extra');

exports.process = function(source, callback) {
  callback(null, source);
  var child = require('child_process').fork('api/sources/processor.js');
  child.send({operation:'process', sourceId: source._id});
}

exports.getTile = function(source, format, z, x, y, params, callback) {
  console.log('get tile ' + z + '/' + x + '/' + y + '.png for source ' + source.name);

  var tile = config.server.sourceDirectory.path + "/" + source._id + "/tiles/" + z + '/' + x + '/' + y + '.png';

  if (fs.existsSync(tile)) {
    var stream = fs.createReadStream(tile);
    var tileSize = 0;
    stream.on('data', function(chunk) {
      tileSize += chunk.length;
    });
    stream.on('end', function() {
      SourceModel.updateSourceAverageSize(source, tileSize, function(err) {
      });
    });
    callback(null, stream);
  } else {
    callback();
  }
}

exports.getData = function(source, callback) {
  callback(null);
}

exports.processSource = function(source, callback) {
  console.log('running ' + 'mb-util ' + source.file.path + " " + config.server.sourceDirectory.path + "/" + source._id + "/tiles");
  source.status.message = "Extracting MBTiles";
  SourceModel.updateDatasource(source, function(err, source) {
    var python = exec(
      'mb-util ' + source.file.path + " " + config.server.sourceDirectory.path + "/" + source._id + "/tiles",
     function(error, stdout, stderr) {
       source.status.message = "Complete";
       source.status.complete = true;
       SourceModel.updateDatasource(source, function(err, updatedSource) {
         console.log('done running ' +   'mb-util ' + source.file.path + " " + config.server.sourceDirectory.path + "/" + source._id + "/tiles");
         callback(err);
       });
     });
   });
}
