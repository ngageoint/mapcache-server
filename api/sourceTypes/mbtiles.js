var SourceModel = require('../../models/source')
  , exec = require('child_process').exec
  , config = require('../../config.json')
  , fs = require('fs-extra');

exports.createCache = function(cache) {
  var child = require('child_process').fork('api/sourceTypes/mbtilesProcessor');
  child.send({operation:'generateCache', cache: cache});
}

exports.process = function(source, callback) {
  console.log("mbtiles");

  console.log('running ' + 'mb-util ' + source.filePath + " .");
  source.status = "Extracting MBTiles";
  source.save();
  callback(null, source);
  var python = exec(
    'mb-util ' + source.filePath + " " + config.server.sourceDirectory.path + "/" + source._id + "/tiles",
   function(error, stdout, stderr) {
     source.status = "Complete";
     source.complete = true;
     source.save();
     console.log('done running ' +   'mb-util ' + source.filePath + " " + config.server.sourceDirectory.path + "/" + source._id + "/tiles");
   });
}

exports.getTile = function(source, z, x, y, callback) {
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
