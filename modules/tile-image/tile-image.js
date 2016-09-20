var lwip = require('lwip')
  , request = require('request');

exports.pngRequestToJpegStream = function(url, callback) {
  var canvas = PureImage.make(256,256);
  var ctx = canvas.getContext('2d');
  var height = canvas.height;

  ctx.clearRect(0, 0, height, height);

  request.get({url: url,
    headers: {'Content-Type': 'image/png'},
    encoding: null
  }, function(err, response, image) {
		if (err){
			console.log('error retrieving image ' + url, err);
      return callback(err, null);
		}
    lwip.open(image, 'png', function(err, image) {
      image.toBuffer('jpg', callback);
    });
  });
};
