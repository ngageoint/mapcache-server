var SourceModel = require('../../models/source')
  , path = require('path')
  , fs = require('fs-extra')
  , config = require('../../config.js')
  , Canvas = require('canvas')
  , Image = Canvas.Image
  , turf = require('turf')
  , xyzTileWorker = require('../xyzTileWorker')
  , tileUtilities = require('../tileUtilities')
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
  source.status.message = "Parsing kmz";
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
        }, function done() {
          source.status.totalFeatures = gjData.features.length;
          var geometry = turf.envelope(gjData);
        	source.geometry = geometry;
          source.style = {
        		defaultStyle: {
        			style: {
        				'fill': "#000000",
        				'fill-opacity': 0.5,
        				'stroke': "#0000FF",
        				'stroke-opacity': 1.0,
        				'stroke-width': 1
        			}
        		},
        		styles: []
        	};
          source.status.complete = true;
    			source.status.message = "Complete";
    			source.properties = [];
    			var allProperties = {};
    			for (var i = 0; i < gjData.features.length; i++) {
    				var feature = gjData.features[i];
    				for (var property in feature.properties) {
    					allProperties[property] = allProperties[property] || {key: property, values:[]};
    					if (allProperties[property].values.indexOf(feature.properties[property]) == -1) {
    						allProperties[property].values.push(feature.properties[property]);
    					}
    				}
    			}
    			for (var property in allProperties) {
    				source.properties.push(allProperties[property]);
    			}
          source.save(callback);
        });
      });
      console.log('parse shapefile to json');
      console.time('shape to json');
      shp2json(stream).pipe(parser).pipe(outStream);
    }
  });
}
