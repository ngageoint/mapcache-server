var Canvas = require('canvas')
  , Image = Canvas.Image
  , request = require('request');

exports.pngRequestToJpegStream = function(url, callback) {
  var canvas = new Canvas(256,256);
  var ctx = canvas.getContext('2d');
  var height = canvas.height;

  ctx.clearRect(0, 0, height, height);

  req = request.get({url: url,
    headers: {'Content-Type': 'image/png'},
    encoding: null
  }, function(err, response, image) {
		if (err){
			console.log('error retrieving image ' + url, err);
      return callback(err, null);
		}
    img = new Image;
    img.src = image;
    ctx.drawImage(img, 0, 0, img.width, img.height);
    callback(null, canvas.jpegStream());
  });
}
