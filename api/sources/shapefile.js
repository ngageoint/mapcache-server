var SourceModel = require('../../models/source')
  , path = require('path')
  , fs = require('fs-extra')
  , tileUtilities = require('../tileUtilities.js')
  , config = require('../../config.json')
  , shp2json = require('shp2json');

exports.process = function(source, callback) {
  callback(null, source);
  var child = require('child_process').fork('api/sources/processor.js');
  child.send({operation:'process', sourceId: source.id});
}

exports.getFeatures = tileUtilities.getFeatures;
exports.getTile = tileUtilities.getVectorTile;

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
  source.status.message = "Parsing shapefile";
  source.vector = true;
  source.save(function(err) {

    var stream = fs.createReadStream(source.filePath);

    var dir = path.join(config.server.sourceDirectory.path, source.id);
    var fileName = path.basename(path.basename(source.filePath), path.extname(source.filePath)) + '.geojson';
    var file = path.join(dir, fileName);

  	if (!fs.existsSync(file)) {

  		var outStream = fs.createWriteStream(file);
      var gj = "";


      var Transform = require('stream').Transform;

      var parser = new Transform();
      parser._transform = function(data, encoding, done) {
        console.log('data transforming');
        gj = gj + data.toString();
        this.push(data);
        done();
      };

      outStream.on('close',function(status){
        console.timeEnd('shape to json');
        console.time('parsing geojson');
        var gjData = JSON.parse(gj);
        console.timeEnd('parsing geojson');
        tileUtilities.generateMetadataTiles(source, gjData, callback);
      });
      console.log('parse shapefile to json');
      console.time('shape to json');
      try {
        shp2json(stream).pipe(parser).pipe(outStream);
      } catch (err) {
        callback(err);
      }
    }
  });
}
