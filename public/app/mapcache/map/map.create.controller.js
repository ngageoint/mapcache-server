angular
  .module('mapcache')
  .controller('MapCreateController', MapCreateController);

MapCreateController.$inject = [
  '$scope',
  '$rootScope',
  '$location',
  '$timeout',
  '$http',
  'CacheService',
  'MapService'
];

function MapCreateController($scope, $rootScope, $location, $timeout, $http, CacheService, MapService) {
  $rootScope.title = 'Create A Map';

  $scope.validUrlFormats = [{format:'geojson'}, {format:'xyz'}, {format:'tms'}, {format:'wms'}, {format:'arcgis'}];
  $scope.validFileFormats = [{format:'geotiff'}, {format:'mbtiles'}, {format:'geojson'}, {format:'shapefile'}, {format:'kmz'}, {format: 'mrsid'}];

  $scope.map = {
  };

  $scope.mapOptions = {
    baseLayerUrl: 'http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png',
    opacity: .5
  };

  var uploadProgress = function(e) {
    if(e.lengthComputable){
      $scope.$apply(function() {
        $scope.progress = (e.loaded/e.total) * 100;
        console.log('uploadprogress ' + $scope.progress);
      });
    }
  }

  function pruneMap(s) {
    // s.dataMaps = s.dataMaps || [];
    // s.dataMaps.push({
    //   url: s.url,
    //   filePath: s.filePath,
    //   format: s.format,
    //   zOrder: 0,
    //   wmsGetCapabilities: s.wmsGetCapabilities
    // });
    delete s.wmsGetCapabilities;
  }

  $scope.createMap = function() {
    console.log($scope.cache);
    $scope.mapSubmitted = true;
    pruneMap($scope.map);
    MapService.createMap($scope.map, function(map) {
      console.log('map created', map);
      // now start a timer to watch the map be created
      $location.path('/map/'+map.id);
    }, function() {
      console.log("error");
    }, uploadProgress);
  }

  $scope.$on('uploadFile', function(e, uploadFile) {
    console.log('upload file is', uploadFile);
    $scope.locationStatus = 'success';
    $scope.mapInformation = {
      file: {
        name: uploadFile.name
      }
    };
    delete $scope.map.url;
    delete $scope.map.format;
    $scope.map.mapFile = uploadFile;

    var fileType = uploadFile.name.split('.').pop().toLowerCase();
    switch(fileType) {
      case 'tif':
      case 'tiff':
      case 'geotiff':
      case 'geotif':
        $scope.mapInformation.format = 'geotiff';
        $scope.map.format = 'geotiff';
        break;
      case 'sid':
        $scope.mapInformation.format = 'mrsid';
        $scope.map.format = 'mrsid';
        break;
      case 'mbtiles':
        $scope.mapInformation.format = 'mbtiles';
        $scope.map.format = 'mbtiles';
        break;
      case 'zip':
        $scope.mapInformation.format = 'shapefile';
        $scope.map.format = 'shapefile';
        break;
      case 'kmz':
        $scope.mapInformation.format = 'kmz';
        $scope.map.format = 'kmz';
        break;
      case 'json':
      case 'geojson':
        $scope.mapInformation.format = 'geojson';
        $scope.map.format = 'geojson';
        break;
    }

    console.log('map information')
  });

  function getMapProgress() {
    MapService.refreshMap($scope.map, function(map) {
      // success
      $scope.map = map;
      if (!map.complete) {
        $timeout(getMapProgress, 5000);
      }
    }, function(data) {
      // error
    });
  }

  $scope.$watch('map.wmsLayer', function(layer, oldLayer) {
    if (layer) {
      if (layer.EX_GeographicBoundingBox) {
        $scope.mapOptions.extent = layer.EX_GeographicBoundingBox;
      }
    }
  });

  $scope.$watch('mapInformation', function(mapInformation, oldMapInformation) {
    if (!mapInformation) {
      delete $scope.map.wmsGetCapabilities;
      return;
    }
  });

  $scope.$watch('mapInformation.wmsGetCapabilities', function(capabilities, oldCapabilities) {
    if (capabilities && capabilities.Capability) {
      $scope.wmsLayers = capabilities.Capability.Layer.Layer || [capabilities.Capability.Layer];
    } else {
      $scope.wmsLayers = [];
    }
  });

  $scope.$watch('map.format', function(format, oldFormat) {
    console.log('map format', $scope.map.format);
    switch ($scope.map.format) {
      case 'wms':
        if (!$scope.mapInformation.wmsGetCapabilities) {
          $scope.fetchingCapabilities = true;
          $http.get('/api/maps/wmsFeatureRequest',
          {
            params: {
              wmsUrl: $scope.map.url
            }
          }).success(function (data) {
            $scope.fetchingCapabilities = false;
            $scope.map.wmsGetCapabilities = $scope.mapInformation.wmsGetCapabilities = data;
            $scope.showMap = true;
          });
        } else {
          $scope.map.wmsGetCapabilities = $scope.mapInformation.wmsGetCapabilities;
        }
        $scope.showMap = true;
        break;
      case 'arcgis':
        $scope.showMap = true;
        $scope.map.wmsGetCapabilities = $scope.mapInformation.wmsGetCapabilities;
        break;
      case 'xyz':
      case 'tms':
        $scope.showMap = true;
        break;
      default:
        $scope.showMap = false;
    }
  });

  var urlChecker = _.debounce(function() {

    $scope.$apply(function() {
      $scope.mapInformation = undefined;
      $scope.urlDiscovery = true;
      $scope.map.mapFile = undefined;
      $scope.$broadcast('clearFile');
    });

    console.log('url is valid, what is it?');
    $http.get('/api/maps/discoverMap',
    {
      params: {
        url: $scope.map.url
      }
    }).success(function (data) {
      $scope.urlDiscovery = false;
      $scope.mapInformation = data;
      if (data.format) {
        $scope.map.format = data.format;
      }
      $scope.map.tilesLackExtensions = data.tilesLackExtensions;

      if ($scope.mapInformation.valid && !$scope.mapInformation.format) {
        $scope.locationStatus = 'warning';
      } else if (!$scope.mapInformation.valid) {
        $scope.locationStatus = 'error';
      } else {
        $scope.locationStatus = 'success';
      }
    }).error(function(err) {
      $scope.urlDiscovery = false;
      $scope.mapInformation = undefined;
      $scope.locationStatus = undefined;
    });
  }, 500);

  $scope.$on('location-url', function(e, location) {
    if (!location) {
      $scope.mapInformation = undefined;
      delete $scope.map.url;
      return;
    }
    $scope.urlDiscovery = true;
    $scope.map.url = location;
    urlChecker();
  });

};
