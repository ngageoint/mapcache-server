var async = require('async')
  , Canvas = require('canvas')
  , Image = Canvas.Image;

exports.process = function(source, callback) {
  async.each(source.dataSources, function(dataSource, callback) {
    console.log('about to process the datasource', dataSource);
    var processor = require('./' + dataSource.format);

    processor.process(dataSource, callback);

  }, function() {
    // source.status.message = "Complete";
    // source.status.complete = true;
    callback(null, source);
    // source.save(function() {
    //   callback(null, source);
    // });
  });
}

function pullTileFromSource(source, format, z, x, y, params, callback) {
  console.log('pull tile from source', source);
  var processor = require('./' + source.format);

  processor.getTile(source, format, z, x, y, params, callback);
}

exports.getTile = function(source, format, z, x, y, params, callback) {

  var sorted = source.dataSources.sort(zOrderDatasources);

  var canvas = new Canvas(256,256);
  var ctx = canvas.getContext('2d');
  var padding = 0;
  totalExtent = 4096 * (1 + padding * 2),
  height = canvas.height = canvas.width,
  ratio = height / totalExtent,
  pad = 4096 * padding * ratio;

  ctx.clearRect(0, 0, height, height);

  async.eachSeries(sorted, function iterator(s, callback) {

    pullTileFromSource(s, format, z, x, y, params, function(err, tileStream) {
      if (!tileStream) return callback();
      var buffer = new Buffer(0);
      var chunk;
      tileStream.on('data', function(chunk) {
        buffer = Buffer.concat([buffer, chunk]);
      });
      tileStream.on('end', function() {
        var img = new Image;
        img.onload = function() {
          ctx.drawImage(img, 0, 0, img.width, img.height);
          callback();
        };
        img.src = buffer;
      });
    });
  }, function done() {
    var cp = require('child_process');
    var pngquant = cp.spawn('./utilities/pngquant/pngquant', ['-']);
    canvas.pngStream().pipe(pngquant.stdin);
    callback(null, pngquant.stdout);
  });

}

function zOrderDatasources(a, b) {
  if (a.zOrder < b.zOrder) {
    return -1;
  }
  if (a.zOrder > b.zOrder) {
    return 1;
  }
  // a must be equal to b
  return 0;
}

exports.getData = function(source, format, west, south, east, north, callback) {
  var processor = require('./' + source.format);
  processor.getData(source, format, west, south, east, north, callback);
}

exports.getFeatures = function(source, west, south, east, north, z, callback) {
  var processor = require('./' + source.format);
  if (processor.getFeatures) {
    processor.getFeatures(source, west, south, east, north, z, callback);
  } else {
    callback(null, null);
  }
}
