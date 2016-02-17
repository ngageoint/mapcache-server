var $ = require('jquery');
module.exports = function MapService($q, $http, $rootScope, LocalStorageService) {

  var resolvedMaps = {};
  var resolveAllMaps = null;

  var validUrlFormats = [{format:'geojson'}, {format:'xyz'}, {format:'tms'}, {format:'wms'}, {format:'arcgis'}];
  var validFileFormats = [{format:'geotiff'}, {format:'mbtiles'}, {format:'geojson'}, {format:'shapefile'}, {format:'kmz'}, {format: 'mrsid'}];

  var service = {
    getAllMaps: getAllMaps,
    deleteMap: deleteMap,
    createMap: createMap,
    saveMap: saveMap,
    getMap: getMap,
    discoverMap: discoverMap,
    getWmsGetCapabilities: getWmsGetCapabilities,
    deleteDataSource: deleteDataSource,
    getCachesForMap: getCachesForMap,
    getFeatures: getFeatures,
    validUrlFormats: validUrlFormats,
    validFileFormats: validFileFormats
  };

  return service;

  function getAllMaps(forceRefresh) {
    if (forceRefresh) {
        resolvedMaps = {};
        resolveAllMaps = undefined;
    }

    resolveAllMaps = resolveAllMaps || $http.get('/api/maps').then(function(data) {
      return data.data;
    });

    resolveAllMaps.then(function(maps) {
      for (var i = 0; i < maps.length; i++) {
        resolvedMaps[maps[i]._id] = $q.when(maps[i]);
      }
    });

    return resolveAllMaps;
  }

  function getCachesForMap(map, success, error) {
    $http.get('/api/maps/'+map.id+'/caches')
      .then(function(data) { return data.data; })
      .then(success, error);
  }

  function getMap(map, success, error) {
    $http.get('/api/maps/'+map.id)
      .then(function(data) { return data.data; }).then(success, error);
  }

  function deleteMap(map, success, error) {
    var url = '/api/maps/' + map.id;
    $http.delete(url)
      .then(function(data) { return data.data; })
      .then(success, error);
  }

  function deleteDataSource(map, dataSourceId, success, error) {
    $http.delete('/api/maps/' + map.id + '/dataSources/' + dataSourceId)
      .then(function(data) { return data.data; })
      .then(success, error);
  }

  function saveMap(map, success, error) {
    var newMap = {};
    for (var key in map) {
      if (map.hasOwnProperty(key) && key !== 'mapFile' && key !== 'data' ) {
        newMap[key] = map[key];
      }
    }
    $http.put(
      '/api/maps/'+newMap.id,
      newMap,
      {headers: {"Content-Type": "application/json"}}
    ).then(function(data) { return data.data; }).then(success, error);
  }

  function getFeatures(map, west, south, east, north, zoom, success, error) {
    $http.get('/api/maps/'+map.id+'/features?west='+ west + '&south=' + south + '&east=' + east + '&north=' + north + '&zoom=' + zoom)
      .then(function(data) { return data.data; })
      .then(success, error);
  }

  function discoverMap(url, success, error) {
    $http.get('/api/maps/discoverMap',
    {
      params: {
        url: url
      }
    }).then(function(data) { return data.data;}).then(success, error);
  }

  function getWmsGetCapabilities(url, success, error) {
    $http.get('/api/maps/wmsFeatureRequest',
    {
      params: {
        wmsUrl: url
      }
    }).then(function(data) { return data.data; }).then(success, error);
  }

  function createMap(map, success, error, progress) {
    var formData = new FormData();
    for (var i = 0; i < map.dataSources.length; i++) {
      if (map.dataSources[i].file) {
        formData.append('mapFile', map.dataSources[i].file);
        map.dataSources[i].file = {name: map.dataSources[i].file.name};
      }
    }

    var sendMap = map;
    delete sendMap.mapFile;
    delete sendMap.data;

    formData.append('map', JSON.stringify(sendMap));

    $.ajax({
      url: '/api/maps',
      type: 'POST',
      headers: {
        authorization: 'Bearer ' + LocalStorageService.getToken()
      },
      xhr: function() {
        var myXhr = $.ajaxSettings.xhr();
        if(myXhr.upload){
            myXhr.upload.addEventListener('progress',progress, false);
        }
        return myXhr;
      },
      success: function(response) {
        $rootScope.$apply(function() {
          success(response);
        });
      },
      error: error,
      data: formData,
      cache: false,
      contentType: false,
      processData: false
    });
  }
};
