var SourceModel = require('../../models/source')
  , path = require('path')
  , request = require('request')
  , fs = require('fs-extra')
  , tileUtilities = require('../tileUtilities.js')
  , config = require('../../config.json');

exports.process = function(source, callback) {
  callback(null, source);
  var child = require('child_process').fork('api/sources/processor.js');
  child.send({operation:'process', sourceId: source.id});
}

exports.getTile = tileUtilities.getVectorTile;
exports.getFeatures = tileUtilities.getFeatures;

exports.getData = function(source, format, callback) {

  var dir = path.join(config.server.sourceDirectory.path, source.id);
  if (format == 'geojson') {
    var fileName = path.basename(path.basename(source.filePath), path.extname(source.filePath)) + '.geojson';
    var file = path.join(dir, fileName);
    console.log('pull from path', file);

    if (fs.existsSync(file)) {
      callback(null, {file: file});
      // fs.readFile(file, callback);
    } else {
      callback(null);
    }
  }
}

exports.processSource = function(source, callback) {
  source.status.message = "Parsing GeoJSON";
  source.vector = true;
  source.save(function(err) {
    if (source.url) {
      var dir = path.join(config.server.sourceDirectory.path, source.id);
      fs.mkdirp(dir, function(err) {
        if (err) return callback(err);
        var req = request.get({url: source.url})
        .on('error', function(err) {
          console.log(err+ source.url);

          callback(err);
        })
        .on('response', function(response) {
          var size = response.headers['content-length'];
          SourceModel.updateSourceAverageSize(source, size, function(err) {
          });
        });
        if (req) {
          var stream = fs.createWriteStream(dir + '/' + source.id + '.geojson');
      		stream.on('close',function(status){
            fs.stat(dir + '/' + source.id + '.geojson', function(err, stat) {
              source.filePath = dir + '/' + source.id + '.geojson';
              source.size = stat.size;
              source.status = {
                message: "Creating",
                complete: false,
                zoomLevelStatus: {}
              };
              SourceModel.updateSource(source.id, source, function(err, updatedSource) {
                console.log('saved the source', updatedSource);
                parseGeoJSONFile(updatedSource, callback);
              });
            });
      		});

    			req.pipe(stream);
        }
      });

    } else if (fs.existsSync(source.filePath)) {
      parseGeoJSONFile(source, callback);
    }
  });
}

function parseGeoJSONFile(source, callback) {
  var stream = fs.createReadStream(source.filePath);
  console.log('reading in the file', source.filePath);
  fs.readFile(source.filePath, function(err, fileData) {
    console.log('parsing file data', source.filePath);
    console.time('parsing geojson');
    var gjData = JSON.parse(fileData);
    console.timeEnd('parsing geojson');
    tileUtilities.generateMetadataTiles(source, gjData, callback);
  });
}
