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
    $http.get('/api/maps/'+map.id+'/caches').then(function(caches) {
      if (success) {
        success(caches.data);
      }
    }, function(data) {
      if (error) {
        error(data);
      }
    });
  }

  function getMap(map, success, error) {
    $http.get('/api/maps/'+map.id).then(function(data) {
      if (success) {
        success(data.data);
      }
    }, function(data) {
      if (error) {
        error(data);
      }
    });
  }

  function deleteMap(map, success) {
    var url = '/api/maps/' + map.id;
    $http.delete(url).then(function(map) {
      console.log('successfully deleted map', map.data);
      if (success) {
        success(map.data);
      }
    }, function(map) {
      console.log('error deleting map', map);
    });
  }

  /**
   *  907  yum search postgresql
  908  yum uninstall postgres
  909  yum --help
  910  yum upgrade postgresql
  911  yum erase postgresql
  912  yum install postgresql postgresql-server postgresql-devel postgresql-contrib postgresql-docs
  913  yum --showduplicates list postgresql | expand
  914  yum --showduplicates list postgresql
  915  yum search postgresql
  916  yum install postgresql93 postgresql93-server postgresql93-devel postgresql93-contrib postgresql93-docs
  917  ls
  918  cd postgis
  919  ls
  920  yum install geos-devel
  921  yum install libxml2-devel
  922  yum install json-c-devel
  923  ls
  924  cd postgis-2.1.7
  925  ls
  926  ./config  --with-geosconfig=/usr/local/bin/geos-config
  927  ./configure --with-geosconfig=/usr/local/bin/geos-config
  928  make
  929  make install
  930  service postgresql initdb

   */

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

  function discoverMap(url, success, error) {
    $http.get('/api/maps/discoverMap',
    {
      params: {
        url: url
      }
    }).success(success).error(error);
  }

  function getWmsGetCapabilities(url, success, error) {
    $http.get('/api/maps/wmsFeatureRequest',
    {
      params: {
        wmsUrl: url
      }
    }).success(success).error(error);
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
};
