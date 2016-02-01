module.exports = function MapService($q, $http, $rootScope, LocalStorageService) {

  var resolvedMaps = {};
  var resolveAllMaps = null;

  var validUrlFormats = [{format:'geojson'}, {format:'xyz'}, {format:'tms'}, {format:'wms'}, {format:'arcgis'}];
  var validFileFormats = [{format:'geotiff'}, {format:'mbtiles'}, {format:'geojson'}, {format:'shapefile'}, {format:'kmz'}, {format: 'mrsid'}];

  var service = {
    getAllMaps: getAllMaps,
    refreshMap: refreshMap,
    deleteMap: deleteMap,
    createMap: createMap,
    saveMap: saveMap,
    getMap: getMap,
    getMapVectorTile: getMapVectorTile,
    getMapData: getMapData,
    deleteDataSource: deleteDataSource,
    getCachesForMap: getCachesForMap,
    getFeatures: getFeatures,
    validUrlFormats: validUrlFormats,
    validFileFormats: validFileFormats
  };

  return service;

  function getMap(mapId) {
    return $http.get('/api/maps/'+mapId);
  }

  function getAllMaps(forceRefresh) {
    if (forceRefresh) {
        resolvedMaps = {};
        resolveAllMaps = undefined;
    }

    resolveAllMaps = resolveAllMaps || $http.get('/api/maps').success(function(maps) {
      for (var i = 0; i < maps.length; i++) {
        resolvedMaps[maps[i]._id] = $q.when(maps[i]);
      }
    });

    return resolveAllMaps;
  }

  function getCachesForMap(map, success, error) {
    $http.get('/api/maps/'+map.id+'/caches').success(function(caches) {
      if (success) {
        success(caches);
      }
    }).error(function(data, status) {
      if (error) {
        error(data, status);
      }
    });
  }

  function refreshMap(map, success, error) {
    $http.get('/api/maps/'+map.id)
      .success(function(data, status) {
        if (success) {
          success(data, status);
        }
      }).error(function(data, status) {
        if (error) {
          error(data, status);
        }
      });
  }

  function getMapData(map, success, error) {
    $http.get('/api/maps/'+map.id+'/geojson')
      .success(function(data, status) {
        if (success) {
          success(data, status);
        }
      }).error(function(data, status) {
        if (error) {
          error(data, status);
        }
      });
  }

  function getMapVectorTile(map, z, x, y, success, error) {
    $http.get('/api/maps/'+map.id+'/' + z + '/' + x + '/' + y + '.png')
      .success(function(data, status) {
        if (success) {
          success(data, status);
        }
      }).error(function(data, status) {
        if (error) {
          error(data, status);
        }
      });
  }

  function deleteMap(map, format, success) {
    var url = '/api/maps/' + map.id;
    if (format) {
      url += '/' + format;
    }
    $http.delete(url).success(function(map) {
      console.log('successfully deleted map', map);
      if (success) {
        success(map);
      }
    }).error(function(map) {
      console.log('error deleting map', map);
    });
  }

  function deleteDataSource(map, dataSourceId, success) {
    $http.delete('/api/maps/' + map.id + '/dataSources/' + dataSourceId).success(function(map) {
      if (success) {
        success(map);
      }
    }).error(function(map) {
      console.log('error deleting datasource', map);
    });
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
    ).success(function(newMap) {
      console.log("updated a map", newMap);
      if (success) {
        success(newMap);
      }
    }).error(error);
  }

  function getFeatures(map, west, south, east, north, zoom, success, error) {
    $http.get('/api/maps/'+map.id+'/features?west='+ west + '&south=' + south + '&east=' + east + '&north=' + north + '&zoom=' + zoom)
      .success(function(data, status) {
        if (success) {
          success(data, status);
        }
      }).error(function(data, status) {
        if (error) {
          error(data, status);
        }
      });
  }

  function createMap(map, success, error, progress) {

    // if (map.mapFile) {
        var formData = new FormData();
        for (var i = 0; i < map.dataSources.length; i++) {
          if (map.dataSources[i].file) {
            console.log('file', map.dataSources[i].file);
            formData.append('mapFile', map.dataSources[i].file);
            map.dataSources[i].file = {name: map.dataSources[i].file.name};
          }
        }

        var sendMap = map;
        delete sendMap.mapFile;
        delete sendMap.data;

        formData.append('map', JSON.stringify(sendMap));

        // for (var key in map) {
        //   if (map.hasOwnProperty(key) && key != 'mapFile' && key != 'data' ) {
        //     if (typeof map[key] === 'string' || map[key] instanceof String) {
        //       formData.append(key, map[key]);
        //     } else {
        //       formData.append(key, angular.toJson(map[key]));
        //     }
        //   }
        // }

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
      // } else {
      //   $http.post(
      //     '/api/maps',
      //     map,
      //     {headers: {"Content-Type": "application/json"}}
      //   ).success(function(map) {
      //     console.log("created a map", map);
      //     if (success) {
      //       success(map);
      //     }
      //   }).error(error);
      // }
  }
}
