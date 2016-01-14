var request = require('request')
  , proj4 = require('proj4')
  , turf = require('turf');

var ArcGIS = function(config) {
  config = config || {};
  this.source = config.source;
  this.cache = config.cache;
  if (this.cache) {
    throw new Error("cannot create an ArcGIS cache at this time")
  }
}

ArcGIS.prototype.initialize = function() {
}

ArcGIS.prototype.processSource = function(doneCallback, progressCallback) {
  var self = this;
  doneCallback = doneCallback || function() {};
  progressCallback = progressCallback || function(source, callback) { callback(null, source); };
  this.source.status = {};
  this.source.status.message = "Parsing ArcGIS json";
  this.source.status.complete = false;
  progressCallback(this.source, function(err, source) {
    self.source = source;
    request.get({url: self.source.url + '?f=pjson'}, function(err, response, body) {
      if (!err && response && response.statusCode == 200) {
        self.source.wmsGetCapabilities = JSON.parse(body);

        if (self.source.wmsGetCapabilities.fullExtent && self.source.wmsGetCapabilities.fullExtent.spatialReference && self.source.wmsGetCapabilities.fullExtent.spatialReference.wkid && (self.source.wmsGetCapabilities.fullExtent.spatialReference.wkid == 102100 || self.source.wmsGetCapabilities.fullExtent.spatialReference.wkid == 102113 || self.source.wmsGetCapabilities.fullExtent.spatialReference.wkid == 3857)) {
          var ll = proj4('EPSG:3857', 'EPSG:4326', [self.source.wmsGetCapabilities.fullExtent.xmin, self.source.wmsGetCapabilities.fullExtent.ymin]);
          var ur = proj4('EPSG:3857', 'EPSG:4326', [self.source.wmsGetCapabilities.fullExtent.xmax, self.source.wmsGetCapabilities.fullExtent.ymax]);
          self.source.geometry = turf.bboxPolygon([ll[0], ll[1], ur[0], ur[1]]);
        }

        self.source.status.message = "Complete";
        self.source.status.complete = true;
      }
      doneCallback(null, self.source);
    });
  });
}

// ArcGIS.prototype.setSourceLayer = function(layer, callback) {
//   this.source.wmsLayer = layer;
//   if (layer.EX_GeographicBoundingBox) {
//     var box = layer.EX_GeographicBoundingBox;
//     this.source.geometry = turf.polygon([[
//       [box[0], box[1]],
//       [box[0], box[3]],
//       [box[2], box[3]],
//       [box[2], box[1]],
//       [box[0], box[1]]
//     ]]);
//   }
//   callback(null, this.source);
// }

ArcGIS.prototype.getTile = function(format, z, x, y, params, callback) {
  console.log('get tile ' + z + '/' + y + '/' + x + '.' + format + ' for source ' + this.source.name);
  console.log('random', getRandomInt(0, this.source.wmsGetCapabilities.tileServers.length));
  var url = this.source.wmsGetCapabilities.tileServers[getRandomInt(0, this.source.wmsGetCapabilities.tileServers.length)] + "/tile/"+z+"/"+y+"/"+x;
  var req = null;

  console.log('url', url);

  if (format == 'jpg' || format == 'jpeg') {
    var canvas = new Canvas(256,256);
    var ctx = canvas.getContext('2d');
    height = canvas.height;

    ctx.clearRect(0, 0, height, height);

    req = request.get({url: url,
      headers: {'Content-Type': 'image/png'},
      encoding: null
    }, function(err, response, image) {
  		if (err){
  			console.log('error in testing', err);
  		}
      if (err) throw err;
      img = new Image;
      img.src = image;
      ctx.drawImage(img, 0, 0, img.width, img.height);
      callback(null, canvas.jpegStream());
    });
  } else {
    req = request.get({url: url,
      headers: {'Content-Type': 'image/png'},
    });
    callback(null, req);
  }

  // req.on('error', function(err) {
  //   console.log(err+ url);
  //
  //   callback(err, tileInfo);
  // })
  // .on('response', function(response) {
  //   var size = response.headers['content-length'];
  //   console.log('size', size);
  //   SourceModel.updateSourceAverageSize(source, size, function(err) {
  //   });
  // });
}

ArcGIS.prototype.generateCache = function(doneCallback, progressCallback) {
  doneCallback(null, null);
}

ArcGIS.prototype.getDataWithin = function(west, south, east, north, projection, callback) {
  callback(null, []);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

module.exports = ArcGIS;
