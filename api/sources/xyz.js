var CacheModel = require('../../models/cache')
  , SourceModel = require('../../models/source')
  , Canvas = require('canvas')
	, Image = Canvas.Image
  , request = require('request');

exports.process = function(source, callback) {
  callback(null, source);
  var child = require('child_process').fork('api/sources/processor.js');
  child.send({operation:'process', sourceId: source.id});
}

exports.getTile = function(source, format, z, x, y, params, callback) {
  console.log('get tile ' + z + '/' + x + '/' + y + '.' + format + ' for source ' + source.name);
  var url = source.url + "/" + z + '/' + x + '/' + y + '.png';
  var req = null;

  if (format == 'jpg' || format == 'jpeg') {
    var canvas = new Canvas(256,256);
    var ctx = canvas.getContext('2d');
    var padding = 0;
    totalExtent = 4096 * (1 + padding * 2),
    height = canvas.height = canvas.width,
    ratio = height / totalExtent,
    pad = 4096 * padding * ratio;

    ctx.clearRect(0, 0, height, height);

    req = request.get({url: url,
      headers: {'Content-Type': 'image/png'},
      encoding: null
    }, function(err, response, squid) {
  		if (err){
  			console.log('error in testing', err);
  		}
      if (err) throw err;
      img = new Image;
      img.src = squid;
      ctx.drawImage(img, 0, 0, img.width, img.height);
      callback(null, canvas.jpegStream());

    });
  } else {
    req = request.get({url: url,
      headers: {'Content-Type': 'image/png'},
    });
    callback(null, req);
  }

  req.on('error', function(err) {
    console.log(err+ url);

    callback(err, tileInfo);
  })
  .on('response', function(response) {
    var size = response.headers['content-length'];
    SourceModel.updateSourceAverageSize(source, size, function(err) {
    });
  });
}

exports.getData = function(source, callback) {
  callback(null);
}

exports.processSource = function(source, callback) {
  console.log("xyz");
  source.status.message = "Complete";
  source.status.complete = true;
  source.save(function(err) {
    callback(err);
  });
}
