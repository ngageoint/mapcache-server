var SourceModel = require('../../models/source')
  , FeatureModel = require('../../models/feature')
  , async = require('async')
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

  if (format == 'geojson') {
    var fileName = source.filePath;
    console.log('pull from path', fileName);

    if (fs.existsSync(fileName)) {
      callback(null, {file: fileName});
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

      var dir = path.join(config.server.sourceDirectory.path, source.id);
      var fileName = path.basename(path.basename(source.filePath), path.extname(source.filePath)) + '.geojson';
      var file = path.join(dir, fileName);

      fs.move(source.filePath, file, function(err){
        source.filePath = file;
        source.save(function(err){
          parseGeoJSONFile(source, callback);
        });
      });
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
    // save the geojson to the db
    var count = 0;
    async.eachSeries(gjData.features, function iterator(feature, callback) {
      // console.log('saving feature %d', count++);
      FeatureModel.createFeatureForSource(feature, source.id, function(err) {
        count++;
        // console.log('err', err);
        async.setImmediate(function() {
          if (count % 1000 == 0) {
            source.status.message="Processing " + ((count/gjData.features.length)*100) + "% complete";
    				source.save(function() {
              callback(null, feature);
    				});
          } else {
            callback(null, feature);
          }
        });
      });

      // async.setImmediate(function () {
      //   callback(null, cache[item]);
      // });
    }, function done() {
      source.status.totalFeatures = gjData.features.length;
      source.save(function(err) {
        tileUtilities.generateMetadataTiles(source, gjData, callback);
      });
    });

  });
}
