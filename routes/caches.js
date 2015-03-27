module.exports = function(app, security) {
  var
      access = require('../access')
    , api = require('../api');

  var passport = security.authentication.passport
    , authenticationStrategy = security.authentication.authenticationStrategy;

  app.all('/api/caches*', passport.authenticate(authenticationStrategy));

  var validateCache = function(req, res, next) {
   // TODO do this
/*
    var layer = req.body;

    if (!layer.type) {
      return res.send(400, "cannot create layer 'type' param not specified");
    }

    if (!layer.name) {
      return res.send(400, "cannot create layer 'name' param not specified");
    }


    req.newLayer = layer;
*/
    next();
  }

  var parseQueryParams = function(req, res, next) {
    var parameters = {};
    parameters.type = req.param('type');

    req.parameters = parameters;

    next();
  }

  // get all caches
  app.get(
    '/api/caches',
    access.authorize('READ_CACHE'),
    parseQueryParams,
    function (req, res) {
      res.json([{"_id":"550c8935b5a4cfb84a554674","name":"UK0","description":"","date":"2015-03-20T21:01:44.810Z","maxZoom":18,"bounds":{"_southWest":{"lat":50.035973672195496,"lng":-12.480468749999998},"_northEast":{"lat":59.712097173322924,"lng":2.9443359375}},"baselayer":true,"source":{"_id":"55030301496add1a7a5d13d4","symbology":"#00FFFF","name":"osm","latestDate":"2015-03-13T04:00:00.000Z","type":"xyz","description":"osm geointapps","url":"http://osm.geointapps.org/osm/","dateCreated":"2015-03-13T15:38:38.000Z","format":"OSM","collectionName":"sources","favoriteSource":true},"lat":54.874035422759206,"long":-4.768066406249999,"collectionName":"caches","cacheLocation":"https://mapcache.geointapps.org/api/caches/","seedStatus":"seeding","sizeOnDisk":{"0":20480,"1":36864,"2":49152,"3":36864,"4":81920,"5":106496,"6":212992,"7":536576,"8":1843200,"9":6086656},"cacheSize":{"0":16614,"1":34968,"2":44514,"3":33526,"4":74113,"5":89766,"6":174828,"7":437755,"8":1502030,"9":4786176},"batch":false},{"_id":"550c8a71b5a4cfb84a554675","name":"DC0","description":"","date":"2015-03-20T21:05:24.926Z","maxZoom":9,"bounds":{"_southWest":{"lat":38.74123075381231,"lng":-77.3272705078125},"_northEast":{"lat":39.036252959636606,"lng":-76.739501953125}},"baselayer":true,"source":{"_id":"55030301496add1a7a5d13d4","symbology":"#00FFFF","name":"osm","latestDate":"2015-03-13T04:00:00.000Z","type":"xyz","description":"osm geointapps","url":"http://osm.geointapps.org/osm/","dateCreated":"2015-03-13T15:38:38.000Z","format":"OSM","collectionName":"sources","favoriteSource":true},"lat":37.72057408318594,"long":126.67236328125,"collectionName":"caches","cacheLocation":"https://mapcache.geointapps.org/api/caches/","seedStatus":"completed","totalTiles":13,"tilesRequested":13,"tilesDownloaded":13,"sizeOnDisk":{"0":20480,"1":20480,"2":24576,"3":20480,"4":20480,"5":20480,"6":40960,"7":69632,"8":65536,"9":81920},"cacheSize":{"0":16614,"1":18946,"2":21032,"3":17890,"4":20131,"5":20315,"6":37902,"7":67666,"8":61330,"9":76697},"batch":false},{"_id":"550c8a71b5a4cfb84a554677","name":"Hawaii2","description":"","date":"2015-03-20T21:05:24.926Z","maxZoom":5,"bounds":{"_southWest":{"lat":18.646245142670608,"lng":-167.6513671875},"_northEast":{"lat":24.78673454198888,"lng":-153.984375}},"baselayer":true,"source":{"_id":"55030301496add1a7a5d13d4","symbology":"#00FFFF","name":"osm","latestDate":"2015-03-13T04:00:00.000Z","type":"xyz","description":"osm geointapps","url":"http://osm.geointapps.org/osm/","dateCreated":"2015-03-13T15:38:38.000Z","format":"OSM","collectionName":"sources","favoriteSource":true},"lat":37.72057408318594,"long":126.67236328125,"collectionName":"caches","cacheLocation":"https://mapcache.geointapps.org/api/caches/","seedStatus":"completed","totalTiles":12,"tilesRequested":12,"tilesDownloaded":12,"sizeOnDisk":{"0":20480,"1":20480,"2":16384,"3":12288,"4":28672,"5":28672},"cacheSize":{"0":16614,"1":18946,"2":14165,"3":9354,"4":17435,"5":17878},"batch":false},{"_id":"550c8a71b5a4cfb84a554678","name":"Portugal3","description":"","date":"2015-03-20T21:05:24.926Z","maxZoom":6,"bounds":{"_southWest":{"lat":36.633162095586556,"lng":-10.283203125},"_northEast":{"lat":42.261049162113856,"lng":-6.1962890625}},"baselayer":true,"source":{"_id":"55030301496add1a7a5d13d4","symbology":"#00FFFF","name":"osm","latestDate":"2015-03-13T04:00:00.000Z","type":"xyz","description":"osm geointapps","url":"http://osm.geointapps.org/osm/","dateCreated":"2015-03-13T15:38:38.000Z","format":"OSM","collectionName":"sources","favoriteSource":true},"lat":37.72057408318594,"long":126.67236328125,"collectionName":"caches","cacheLocation":"https://mapcache.geointapps.org/api/caches/","seedStatus":"completed","totalTiles":11,"tilesRequested":11,"tilesDownloaded":11,"sizeOnDisk":{"0":20480,"1":20480,"2":24576,"3":24576,"4":36864,"5":49152,"6":45056},"cacheSize":{"0":16614,"1":18946,"2":21032,"3":20919,"4":30638,"5":47151,"6":40555},"batch":false},{"_id":"550c8a71b5a4cfb84a554679","name":"Korea4","description":"","date":"2015-03-20T21:05:24.926Z","maxZoom":8,"bounds":{"_southWest":{"lat":33.8339199536547,"lng":123.22265625000001},"_northEast":{"lat":41.60722821271717,"lng":130.1220703125}},"baselayer":true,"source":{"_id":"55030301496add1a7a5d13d4","symbology":"#00FFFF","name":"osm","latestDate":"2015-03-13T04:00:00.000Z","type":"xyz","description":"osm geointapps","url":"http://osm.geointapps.org/osm/","dateCreated":"2015-03-13T15:38:38.000Z","format":"OSM","collectionName":"sources","favoriteSource":true},"lat":37.72057408318594,"long":126.67236328125,"collectionName":"caches","cacheLocation":"https://mapcache.geointapps.org/api/caches/","seedStatus":"completed","totalTiles":88,"tilesRequested":88,"tilesDownloaded":88,"sizeOnDisk":{"0":20480,"1":20480,"2":20480,"3":24576,"4":40960,"5":90112,"6":196608,"7":352256,"8":704512},"cacheSize":{"0":16614,"1":20118,"2":19215,"3":23524,"4":34643,"5":86317,"6":175058,"7":300990,"8":592954},"batch":false},{"_id":"550c8a71b5a4cfb84a554676","name":"Cuba1","description":"","date":"2015-03-20T21:05:24.926Z","maxZoom":7,"bounds":{"_southWest":{"lat":19.041348796589013,"lng":-85.40771484375},"_northEast":{"lat":24.086589258228027,"lng":-73.740234375}},"baselayer":true,"source":{"_id":"55030301496add1a7a5d13d4","symbology":"#00FFFF","name":"osm","latestDate":"2015-03-13T04:00:00.000Z","type":"xyz","description":"osm geointapps","url":"http://osm.geointapps.org/osm/","dateCreated":"2015-03-13T15:38:38.000Z","format":"OSM","collectionName":"sources","favoriteSource":true},"lat":37.72057408318594,"long":126.67236328125,"collectionName":"caches","cacheLocation":"https://mapcache.geointapps.org/api/caches/","seedStatus":"completed","totalTiles":31,"tilesRequested":31,"tilesDownloaded":31,"sizeOnDisk":{"0":20480,"1":20480,"2":24576,"3":20480,"4":45056,"5":65536,"6":86016,"7":155648},"cacheSize":{"0":16614,"1":18946,"2":21032,"3":17890,"4":40713,"5":58929,"6":72354,"7":116733},"batch":false}]);
    }
  );

  // // get layer
  // app.get(
  //   '/api/layers/:layerId',
  //   access.authorize('READ_LAYER_ALL'),
  //   function (req, res) {
  //     var response = layerXform.transform(req.layer, {path: req.getPath()});
  //     res.json(response);
  //   }
  // );
  //
  // // get features for layer (must be a feature layer)
  // app.get(
  //   '/api/events/:eventId/layers/:layerId/features',
  //   validateEventAccess,
  //   function (req, res) {
  //     if (req.layer.type !== 'Feature') return res.status(400).send('cannot get features, layer type is not "Feature"');
  //     if (req.event.layerIds.indexOf(req.layer._id) === -1) return res.status(400).send('layer requested is not in event ' + req.event.name);
  //
  //     new api.Feature(req.layer).getAll(function(err, features) {
  //       res.json({
  //         type: 'FeatureCollection',
  //         features: features
  //       });
  //     });
  //   }
  // );
  //
  // // Create a new layer
  // app.post(
  //   '/api/layers',
  //   access.authorize('CREATE_LAYER'),
  //   validateLayerParams,
  //   function(req, res, next) {
  //     Layer.create(req.newLayer, function(err, layer) {
  //       if (err) return next(err);
  //
  //       var response = layerXform.transform(layer, {path: req.getPath()});
  //       res.location(layer._id.toString()).json(response);
  //     });
  //   }
  // );
  //
  // // Update a layer
  // app.put(
  //   '/api/layers/:layerId',
  //   access.authorize('UPDATE_LAYER'),
  //   validateLayerParams,
  //   function(req, res, next) {
  //     Layer.update(req.layer.id, req.newLayer, function(err, layer) {
  //       if (err) return next(err);
  //
  //       var response = layerXform.transform(layer, {path: req.getPath()});
  //       res.json(response);
  //     });
  //   }
  // );
  //
  // // Archive a layer
  // app.delete(
  //   '/api/layers/:layerId',
  //   access.authorize('DELETE_LAYER'),
  //   function(req, res) {
  //     var layer = req.layer;
  //
  //     Layer.remove(layer, function(err, layer) {
  //       response = {};
  //       if (err) {
  //         response.success = false;
  //         response.message = err;
  //       } else {
  //         response.succes = true;
  //         response.message = 'Layer ' + layer.name + ' has been removed.'
  //       }
  //
  //       res.json(response);
  //     });
  //   }
  // );
}
