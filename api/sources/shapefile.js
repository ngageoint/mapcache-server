var SourceModel = require('../../models/source')
  , path = require('path')
  , async = require('async')
  , fs = require('fs-extra')
  , Canvas = require('canvas')
  , Image = Canvas.Image
  , turf = require('turf')
  , xyzTileWorker = require('../xyzTileWorker')
  , tileUtilities = require('../tileUtilities.js')
  , config = require('../../config.json')
  , geojsonvt = require('geojson-vt')
  , Readable = require('stream').Readable
  , shp2json = require('shp2json');

exports.process = function(source, callback) {
  callback(null, source);
  var child = require('child_process').fork('api/sources/processor.js');
  child.send({operation:'process', sourceId: source.id});
}

exports.getFeatures = function(source, west, south, east, north, zoom, callback) {
  var queryRegion = turf.bboxPolygon([Number(west), Number(south), Number(east), Number(north)]);
  var point = turf.centroid(queryRegion);

  var extent = turf.extent(point);
  var yRange = tileUtilities.yCalculator(extent, zoom);
  var xRange = tileUtilities.xCalculator(extent, zoom);
  var x = xRange.min;
  var y = yRange.min;

  var tileIndex = geojsonvt(queryRegion, {
    debug: 2,
    indexMaxZoom: Number(zoom),
    maxZoom: Number(zoom)
  });
  var tile = tileIndex.getTile(Number(zoom), Number(x), Number(y));
  var queryPoly = turf.polygon([tile.features[0].geometry[0]]);
  var queryPoint = turf.centroid(queryPoly);


  var file = path.join(config.server.sourceDirectory.path, source.id.toString(), 'tiles', zoom.toString(), x.toString(), y.toString()+'.json');
  if (fs.existsSync(file)) {
    fs.readFile(file, function(err, fileData) {
      var gjData = JSON.parse(fileData);

      var featureList = [];
      for (var i = 0; i < gjData.features.length; i++) {
        var feature = gjData.features[i];
        var f = {type: 'Feature', properties: feature.tags, geoType: feature.type, geometry: feature.geometry};
        for (var g = 0; g < feature.geometry.length; g++) {
          var innerGeometry = feature.geometry[g];


          try {

            if (feature.type == 1) {
              //Point
              var featurePoint = turf.point(innerGeometry);
              if (turf.inside(featurePoint, queryPoly)) {
                featureList.push(f);
              }
            } else if (feature.type == 3) {
              // Polygon
              var turfPoly = turf.polygon([innerGeometry]);
              if (turf.inside(queryPoint, turfPoly)) {
                featureList.push(f);
              } else {
                if(turf.intersect(queryPoly, turfPoly)) {
                  featureList.push(f);
                }
              }
            }
          } catch (e) {
            console.log('error turfing', e);
          }
        }
      }

      featureList = featureList.sort(function (a, b) {
        if (a.geoType === 1 && b.geoType === 1) {
          var aDistance = turf.distance(turf.point(a.geometry[0]), queryPoint);
          var bDistance = turf.distance(turf.point(b.geometry[0]), queryPoint);
          if (aDistance < bDistance) return -1;
          if (bDistance > aDistance) return 1;
          return 0;
        } else if (a.geoType === 1) {
          return -1;
        } else if (b.geoType === 1) {
          return 1;
        }

        return 0;
      });

      console.log('featureList', featureList);

      callback(null, featureList.length == 0 ? null : featureList);
    });
  }
}

exports.getTile = function(source, format, z, x, y, params, callback) {
  var file = path.join(config.server.sourceDirectory.path, source.id, 'tiles', z, x, y+'.json');
  console.log('looking for the file ', file);
  if (fs.existsSync(file)) {
    console.log('it exists, send it back');
    var tile = "";
    var stream = fs.createReadStream(file);

    if (format == 'json' || format == 'geojson') {
      return callback(null, stream);
    }

    stream.on('data', function(chunk) {
      tile = tile + chunk;
    });

    stream.on('end', function(chunk) {
      console.log('sending back tile ', file);
      try {
      var tileData = JSON.parse(tile.replace(/\bNaN\b/g, "null"));
      if (format == 'png') {
        return createImage(tileData, source, callback);
      } else {
        return callback(null);
      }
    } catch (e) {
      console.log('error with tile ', file);
      return callback(null);
    }
    });
  } else {
    console.log("it doesn't exist, find the parent");
    var parentFile = undefined;
    var foundParent = false;
    var parentZoom = Number(z) - 1;
    var parentX = Math.floor(x / 2);
    var parentY = Math.floor(y / 2);
    while(!foundParent && parentZoom >= 0) {
      parentFile = path.join(config.server.sourceDirectory.path, source.id.toString(), 'tiles', parentZoom.toString(),  parentX.toString(),  parentY.toString()+'.json');
      console.log('looking for parent ', parentFile);
      if (fs.existsSync(parentFile)) {
        foundParent = true;
      } else {
        parentZoom = Number(parentZoom) - 1;
        parentX = Math.floor(parentX / 2);
        parentY = Math.floor(parentY / 2);
      }
    }
    if (foundParent) {
      console.log('found the parent file ', parentFile);
      fs.readFile(parentFile, {encoding: 'utf8'}, function(err, fileData) {
        var gjData = JSON.parse(fileData.replace(/\bNaN\b/g, "null"));
        if (!gjData.source) {
          console.log('there was no source, just try to pull it from the regular data');
          exports.getData(source, 'geojson', function(err, data) {
            var gj = "";
            if (data && data.stream) {
              data.stream.on('data', function(chunk) {
                gj = gj + chunk;
              });

              data.stream.on('end', function(chunk) {
                var gjData = JSON.parse(gj);

                var tileIndex = geojsonvt(gjData,{
                  indexMaxZoom: 0,
                  maxZoom: 18
                });
                var tile = tileIndex.getTile(Number(z), Number(x), Number(y));
                if (tile) {
                  tileUtilities.writeVectorTile(tile, source, z, x, y, function() {
                    // might as well write all the other ones
                    var parentZoom, parentX, parentY, parentFile = null;

                    async.whilst(function() {
                      parentZoom = Number(z) - 1;
                      parentX = Math.floor(x / 2);
                      parentY = Math.floor(y / 2);
                      parentFile = path.join(config.server.sourceDirectory.path, source.id.toString(), 'tiles', parentZoom.toString(),  parentX.toString(),  parentY.toString()+'.json');
                      return !fs.existsSync(parentFile) && parentZoom >= 0;
                    }, function(callback) {
                      var tile = tileIndex.getTile(Number(parentZoom), Number(parentX), Number(parentY));
                      console.log('writing parent tile %d %d %d', parentZoom, parentX, parentY);
                      if (tile) {
                        tileUtilities.writeVectorTile(tile, source, parentZoom, parentX, parentY, callback);
                      } else {
                        callback();
                      }
                    }, function(err) {
                      return exports.getTile(source, format, z, x, y, params, callback);
                    });
                  });
                } else {
                  callback(null);
                }
              });
            } else if (data && data.file) {
              fs.readFile(data.file, {encoding: 'utf8'}, function(err, fileData) {
                var gjData = JSON.parse(fileData.replace(/\bNaN\b/g, "null"));

                var tileIndex = geojsonvt(gjData,{
                  indexMaxZoom: 0,
                  maxZoom: 18
                });
                var tile = tileIndex.getTile(Number(z), Number(x), Number(y));
                if (tile) {
                  tileUtilities.writeVectorTile(tile, source, z, x, y, function() {
                    // might as well write all the other ones
                    var parentZoom, parentX, parentY, parentFile = null;

                    async.whilst(function() {
                      parentZoom = Number(z) - 1;
                      parentX = Math.floor(x / 2);
                      parentY = Math.floor(y / 2);
                      parentFile = path.join(config.server.sourceDirectory.path, source.id.toString(), 'tiles', parentZoom.toString(),  parentX.toString(),  parentY.toString()+'.json');
                      return !fs.existsSync(parentFile) && parentZoom >= 0;
                    }, function(callback) {
                      var tile = tileIndex.getTile(Number(parentZoom), Number(parentX), Number(parentY));
                      console.log('writing parent tile %d %d %d', parentZoom, parentX, parentY);
                      if (tile) {
                        tileUtilities.writeVectorTile(tile, source, parentZoom, parentX, parentY, callback);
                      } else {
                        callback();
                      }
                    }, function(err) {
                      return exports.getTile(source, format, z, x, y, params, callback);
                    });
                  });
                } else {
                  callback(null);
                }
              });
            }

          });
        } else {
          var tileIndex = geojsonvt({},{
            indexMaxZoom: 0,
            maxZoom: 18
          });
          tileIndex.tiles[(((1 << parentZoom) * parentY + parentX) * 32) + parentZoom] = gjData;
          console.log('go get the tile %d %d %d', z, x, y);

          var tile = tileIndex.getTile(Number(z), Number(x), Number(y));
          console.log('got the tile', tile);
          if (tile) {
            console.log('found the tile');
            tileUtilities.writeVectorTile(tile, source, z, x, y, function() {
              console.log('write it');

              // might as well write all the other ones
              var parentZoom, parentX, parentY, parentFile = null;

              async.whilst(function() {
                parentZoom = Number(z) - 1;
                parentX = Math.floor(x / 2);
                parentY = Math.floor(y / 2);
                parentFile = path.join(config.server.sourceDirectory.path, source.id.toString(), 'tiles', parentZoom.toString(),  parentX.toString(),  parentY.toString()+'.json');
                return !fs.existsSync(parentFile) && parentZoom >= 0;
              }, function(callback) {
                var tile = tileIndex.getTile(Number(parentZoom), Number(parentX), Number(parentY));
                console.log('writing parent tile %d %d %d', parentZoom, parentX, parentY);
                if (tile) {
                  tileUtilities.writeVectorTile(tile, source, parentZoom, parentX, parentY, callback);
                } else {
                  callback();
                }
              }, function(err) {
                return exports.getTile(source, format, z, x, y, params, callback);
              });
            });
          } else {
            callback(null);
          }
        }
      });
    } else {

      exports.getData(source, 'geojson', function(err, data) {
        var gj = "";
        if (data && data.stream) {
          data.stream.on('data', function(chunk) {
            gj = gj + chunk;
          });

          data.stream.on('end', function(chunk) {
            var gjData = JSON.parse(gj);

            var tileIndex = geojsonvt(gjData,{
              indexMaxZoom: 0,
              maxZoom: 18
            });
            var tile = tileIndex.getTile(Number(z), Number(x), Number(y));
            if (tile) {
              tileUtilities.writeVectorTile(tile, source, z, x, y, function() {
                return exports.getTile(source, format, z, x, y, params, callback);
              });
            } else {
              callback(null);
            }
          });
        } else if (data && data.file) {
          fs.readFile(data.file, {encoding: 'utf8'}, function(err, fileData) {
            var gjData = JSON.parse(fileData);

            var tileIndex = geojsonvt(gjData,{
              indexMaxZoom: 0,
              maxZoom: 18
            });
            var tile = tileIndex.getTile(Number(z), Number(x), Number(y));
            if (tile) {
              tileUtilities.writeVectorTile(tile, source, z, x, y, function() {
                // might as well write all the other ones
                var parentZoom, parentX, parentY, parentFile = null;

                async.whilst(function() {
                  parentZoom = Number(z) - 1;
                  parentX = Math.floor(x / 2);
                  parentY = Math.floor(y / 2);
                  parentFile = path.join(config.server.sourceDirectory.path, source.id.toString(), 'tiles', parentZoom.toString(),  parentX.toString(),  parentY.toString()+'.json');
                  return !fs.existsSync(parentFile) && parentZoom >= 0;
                }, function(callback) {
                  var tile = tileIndex.getTile(Number(parentZoom), Number(parentX), Number(parentY));
                  console.log('writing parent tile %d %d %d', parentZoom, parentX, parentY);
                  if (tile) {
                    tileUtilities.writeVectorTile(tile, source, parentZoom, parentX, parentY, callback);
                  } else {
                    callback();
                  }
                }, function(err) {
                  return exports.getTile(source, format, z, x, y, params, callback);
                });
              });
            } else {
              callback(null);
            }
          });
        }

      });
    }
  }
}

function styleFunction(feature, style) {
  if (!style) return null;
  // console.log('feature', feature);
  if (style.styles) {
    var sorted = style.styles.sort(styleCompare);
    for (var i = 0; i < sorted.length; i++) {
      var styleProperty = sorted[i];
      var key = styleProperty.key;
      if (feature.tags && feature.tags[key]) {
        if (feature.tags[key] == styleProperty.value) {
          return {
            color: styleProperty.style['stroke'],
            fillOpacity: styleProperty.style['fill-opacity'],
            opacity: styleProperty.style['stroke-opacity'],
            weight: styleProperty.style['stroke-width'],
            fillColor: styleProperty.style['fill']
          };
        }
      }
    }
  }
  var defaultStyle = style.defaultStyle;
  if (!defaultStyle) {
    return null;
  }

  return {
    color: defaultStyle.style['stroke'],
    fillOpacity: defaultStyle.style['fill-opacity'],
    opacity: defaultStyle.style['stroke-opacity'],
    weight: defaultStyle.style['stroke-width'],
    fillColor: defaultStyle.style['fill']
  }
}

function styleCompare(a, b) {
  if (a.priority < b.priority) {
    return -1;
  }
  if (a.priority > b.priority) {
    return 1;
  }
  // a must be equal to b
  return 0;
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
  } : null;
}

function createImage(tile, source, callback) {
  // console.log('creating image', tile);
  var canvas = new Canvas(256,256);
  var ctx = canvas.getContext('2d');
  var padding = 0;//8 / 4096,
  totalExtent = 4096 * (1 + padding * 2),
  height = canvas.height = canvas.width,
  ratio = height / totalExtent,
  pad = 4096 * padding * ratio;

  ctx.clearRect(0, 0, height, height);

  var features = tile.features;
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'red';
  ctx.fillStyle = 'rgba(255,0,0,0.05)';

  for (var i = 0; i < features.length; i++) {
      var feature = features[i],
          type = feature.type;

      ctx.beginPath();

      for (var j = 0; j < feature.geometry.length; j++) {
          var geom = feature.geometry[j];
// console.log('geom', geom);
          if (type === 1) {
              ctx.arc(geom[0] * ratio + pad, geom[1] * ratio + pad, 2, 0, 2 * Math.PI, false);
              continue;
          }

          for (var k = 0; k < geom.length; k++) {
              var p = geom[k];
              if (p[0] == null || p[1] == null) continue;
              if (k) ctx.lineTo(p[0] * ratio + pad, p[1] * ratio + pad);
              else ctx.moveTo(p[0] * ratio + pad, p[1] * ratio + pad);
          }
      }
      var styles = styleFunction(feature, source.style);
      if (styles) {
        var rgbFill = hexToRgb(styles.fillColor);
        ctx.fillStyle = "rgba("+rgbFill.r+","+rgbFill.g+","+rgbFill.b+","+styles.fillOpacity+")";
        ctx.lineWidth = styles.weight;
        var rgbStroke = hexToRgb(styles.color);
        ctx.strokeStyle = "rgba("+rgbStroke.r+","+rgbStroke.g+","+rgbStroke.b+","+styles.opacity+")";
      }
      if (type === 3 || type === 1) ctx.fill('evenodd');
      ctx.stroke();
  }
  callback(null, canvas.pngStream());
}

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

      // stream.on('end', function() {
      //   console.log('stream ended');
      //
      // });

      outStream.on('close',function(status){
        console.timeEnd('shape to json');
        // console.log('gj', gj);
        console.time('parsing geojson');
        var gjData = JSON.parse(gj);
        console.timeEnd('parsing geojson');
        tileUtilities.generateMetadataTiles(source, gjData, callback);
        //tileUtilities.generateMetadataTiles(source, file, callback);
      });
      console.log('parse shapefile to json');
      console.time('shape to json');
      shp2json(stream).pipe(parser).pipe(outStream);
    }
  });
}
