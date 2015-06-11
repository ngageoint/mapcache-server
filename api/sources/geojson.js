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

exports.processSource = function(source, callback) {
  source.status.message = "Parsing GeoJSON";
  source.vector = true;
  source.save(function(err) {
  	if (!fs.existsSync(source.filePath)) {
      var stream = fs.createReadStream(source.filePath);
      fs.readFile(file, function(err, fileData) {
        var gjData = JSON.parse(fileData);
        console.time('parsing geojson');
        var gjData = JSON.parse(gj);
        console.timeEnd('parsing geojson');
        tileUtilities.generateMetadataTiles(source, gjData, callback);
      });
    }
  });
}
