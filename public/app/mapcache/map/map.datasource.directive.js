angular
  .module('mapcache')
  .directive('mapDatasource', mapDatasource);

function mapDatasource() {
  var directive = {
    restrict: "A",
    replace: true,
    templateUrl: 'app/mapcache/map/map-datasource.html',
    scope: {
      mapDatasource: '='
    },
    controller: MapDatasourceController
  };

  return directive;
}

MapDatasourceController.$inject = [
  '$scope',
  '$timeout',
  '$http',
  'MapService'
];

function MapDatasourceController($scope, $timeout, $http, MapService) {

  $scope.showMap = false;
  $scope.validUrlFormats = MapService.validUrlFormats;
  $scope.validFileFormats = MapService.validFileFormats;

  $scope.mapOptions = {
    baseLayerUrl: 'http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png',
    opacity: .5
  };

  $scope.$on('location-url', function(e, location) {
    console.log('location-url caught', location);
    if (!location) {
      $scope.mapDatasource = {};
      return;
    }
    $scope.urlDiscovery = true;
    $scope.mapDatasource.url = location;
    urlChecker();
  });

  var urlChecker = _.debounce(function() {
    $scope.$apply(function() {
      $scope.urlDiscovery = true;
      delete $scope.mapDatasource.file;
      $scope.$broadcast('clearFile');
    });

    console.log('url is valid, what is it?');
    $http.get('/api/maps/discoverMap',
    {
      params: {
        url: $scope.mapDatasource.url
      }
    }).success(function (data) {
      console.log('data', data);
      $scope.urlDiscovery = false;
      $scope.mapDiscovery = data;
      if (data.format) {
        $scope.mapDatasource.format = data.format;
      }
      $scope.mapDatasource.tilesLackExtensions = data.tilesLackExtensions;

      if ($scope.mapDiscovery.valid && !$scope.mapDiscovery.format) {
        $scope.mapDatasource.valid = true;
        $scope.locationStatus = 'warning';
        if (!$scope.mapDatasource.name || $scope.mapDatasource.name == "") {
          $scope.mapDatasource.name = $scope.mapDatasource.url;
        }
      } else if (!$scope.mapDiscovery.valid) {
        $scope.locationStatus = 'error';
        $scope.mapDatasource.valid = false;
      } else {
        $scope.mapDatasource.valid = true;
        $scope.locationStatus = 'success';
        if (!$scope.mapDatasource.name || $scope.mapDatasource.name == "") {
          $scope.mapDatasource.name = $scope.mapDatasource.url;
        }
      }
    }).error(function(err) {
      $scope.urlDiscovery = false;
      $scope.mapDatasource = {};
      $scope.mapDatasource.valid = false;
      $scope.locationStatus = undefined;
    });
  }, 500);

  // $scope.$watch('mapDatasource.file', function(uploadFile) {
  //   if (!uploadFile) return;
  //   console.log('the file', file);
  // });
  //
  $scope.$on('location-file', function(e, uploadFile) {
  //   uploadFile = $scope.mapDatasource.file;
    console.log('location-file caught', uploadFile);
    $scope.locationStatus = 'success';
    $scope.mapDatasource.file = uploadFile;
    if (!$scope.mapDatasource.name || $scope.mapDatasource.name == "") {
      $scope.mapDatasource.name = uploadFile.name;
    }

    delete $scope.mapDatasource.url;
    delete $scope.mapDatasource.format;
    $scope.mapDatasource.valid = true;

    var fileType = uploadFile.name.split('.').pop().toLowerCase();
    switch(fileType) {
      case 'tif':
      case 'tiff':
      case 'geotiff':
      case 'geotif':
        $scope.mapDatasource.format = 'geotiff';
        $scope.format = 'geotiff';
        break;
      case 'sid':
        $scope.mapDatasource.format = 'mrsid';
        $scope.format = 'mrsid';
        break;
      case 'mbtiles':
        $scope.mapDatasource.format = 'mbtiles';
        $scope.format = 'mbtiles';
        break;
      case 'zip':
        $scope.mapDatasource.format = 'shapefile';
        $scope.format = 'shapefile';
        break;
      case 'kmz':
        $scope.mapDatasource.format = 'kmz';
        $scope.format = 'kmz';
        break;
      case 'json':
      case 'geojson':
        $scope.mapDatasource.format = 'geojson';
        $scope.format = 'geojson';
        break;
    }

    console.log('map information')
  });

  var uploadProgress = function(e) {
    if(e.lengthComputable){
      $scope.$apply(function() {
        $scope.progress = (e.loaded/e.total) * 100;
        console.log('uploadprogress ' + $scope.progress);
      });
    }
  }
  //
  // function pruneMap(s) {
  //   delete s.wmsGetCapabilities;
  // }
  //
  // $scope.createMap = function() {
  //   console.log($scope.cache);
  //   $scope.mapSubmitted = true;
  //   pruneMap($scope.map);
  //   MapService.createMap($scope.map, function(map) {
  //     console.log('map created', map);
  //     // now start a timer to watch the map be created
  //     $location.path('/map/'+map.id);
  //   }, function() {
  //     console.log("error");
  //   }, uploadProgress);
  // }

  $scope.$watch('mapDatasource.wmsGetCapabilities', function(capabilities, oldCapabilities) {
    if (capabilities && capabilities.Capability) {
      $scope.wmsLayers = capabilities.Capability.Layer.Layer || [capabilities.Capability.Layer];
    } else {
      $scope.wmsLayers = [];
    }
  });

  $scope.$watch('mapDatasource.format', function(format, oldFormat) {
    console.log('format', $scope.mapDatasource.format);
    switch ($scope.mapDatasource.format) {
      case 'wms':
        if (!$scope.mapDatasource.wmsGetCapabilities) {
          $scope.fetchingCapabilities = true;
          $http.get('/api/maps/wmsFeatureRequest',
          {
            params: {
              wmsUrl: $scope.mapDatasource.url
            }
          }).success(function (data) {
            $scope.fetchingCapabilities = false;
            $scope.mapDatasource.wmsGetCapabilities = data;
            $scope.showMap = true;
          });
        } else {
          $scope.showMap = true;
        }
        break;
      case 'arcgis':
        $scope.showMap = true;
        if ($scope.mapDatasource.wmsGetCapabilities.fullExtent && $scope.mapDatasource.wmsGetCapabilities.fullExtent.spatialReference && $scope.mapDatasource.wmsGetCapabilities.fullExtent.spatialReference.wkid && ($scope.mapDatasource.wmsGetCapabilities.fullExtent.spatialReference.wkid == 102100 || $scope.mapDatasource.wmsGetCapabilities.fullExtent.spatialReference.wkid == 102113 || $scope.mapDatasource.wmsGetCapabilities.fullExtent.spatialReference.wkid == 3857)) {
          var ll = proj4('EPSG:3857', 'EPSG:4326', [$scope.mapDatasource.wmsGetCapabilities.fullExtent.xmin, $scope.mapDatasource.wmsGetCapabilities.fullExtent.ymin]);
          var ur = proj4('EPSG:3857', 'EPSG:4326', [$scope.mapDatasource.wmsGetCapabilities.fullExtent.xmax, $scope.mapDatasource.wmsGetCapabilities.fullExtent.ymax]);
          $scope.mapDatasource.extent = [ll[0], ll[1], ur[0], ur[1]];
        }
        break;
      case 'xyz':
      case 'tms':
        $scope.showMap = true;
        break;
      default:
        $scope.showMap = false;
    }
  });

};
