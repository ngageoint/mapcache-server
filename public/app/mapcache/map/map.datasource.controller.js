var _ = require('underscore');
var proj4 = require('proj4');

module.exports = function MapDatasourceController($scope, $timeout, $http, MapService) {
console.log('MAP DATA SOURCE CONTROLLER');
  $scope.showMap = false;
  $scope.validUrlFormats = MapService.validUrlFormats;
  $scope.validFileFormats = MapService.validFileFormats;

  $scope.mapOptions = {
    baseLayerUrl: 'http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png',
    opacity: 0.5
  };

  var urlChecker = _.debounce(function() {
    console.log('debounce checker');
    $scope.$apply(function() {
      $scope.urlDiscovery = true;
      if ($scope.mapDatasource.file) {
        delete $scope.mapDatasource.file;
      }
      $scope.$broadcast('clearFile');
    });

    MapService.discoverMap($scope.mapDatasource.url, function (data) {
      $scope.urlDiscovery = false;
      $scope.mapDiscovery = data;
      if (data.format) {
        $scope.mapDatasource.format = data.format;
      }
      $scope.mapDatasource.tilesLackExtensions = data.tilesLackExtensions;

      if ($scope.mapDiscovery.valid && !$scope.mapDiscovery.format) {
        $scope.mapDatasource.valid = true;
        $scope.locationStatus = 'warning';
        if (!$scope.mapDatasource.name || $scope.mapDatasource.name === "") {
          $scope.mapDatasource.name = $scope.mapDatasource.url;
        }
      } else if (!$scope.mapDiscovery.valid) {
        $scope.locationStatus = 'error';
        $scope.mapDatasource.valid = false;
      } else {
        $scope.mapDatasource.valid = true;
        $scope.locationStatus = 'success';
        if (!$scope.mapDatasource.name || $scope.mapDatasource.name === "") {
          $scope.mapDatasource.name = $scope.mapDatasource.url;
        }
      }
    }, function() {
      $scope.urlDiscovery = false;
      $scope.mapDatasource = {};
      $scope.mapDatasource.valid = false;
      $scope.locationStatus = undefined;
    });
  }, 500);

  $scope.$on('location-url', function(e, location) {
    console.log('location url hit');
    if (!location) {
      $scope.mapDatasource = {};
      return;
    }
    $scope.urlDiscovery = true;
    $scope.mapDatasource.url = location;
    console.log('go check url');
    urlChecker();
  });

  $scope.$on('location-file', function(e, uploadFile) {
    $scope.locationStatus = 'success';
    $scope.mapDatasource.file = uploadFile;
    if (!$scope.mapDatasource.name || $scope.mapDatasource.name === "") {
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
  });

  $scope.$watch('mapDatasource.metadata.wmsGetCapabilities', function(capabilities) {
    if (capabilities && capabilities.Capability) {
      console.log('setting layers', capabilities.Capability);
      $scope.wmsLayers = capabilities.Capability.Layer.Layer || [capabilities.Capability.Layer];
    } else {
      $scope.wmsLayers = [];
    }
    console.log('scope layers', $scope.wmsLayers);
  });

  $scope.$watch('mapDatasource.format', function(f) {
    console.log('mapdatasource.format', f);
    $scope.mapDatasource.metadata = $scope.mapDatasource.metadata || {};
    switch ($scope.mapDatasource.format) {
      case 'wms':
        if (!$scope.mapDatasource.metadata.wmsGetCapabilities) {
          $scope.fetchingCapabilities = true;
          console.log('go get the capabilities');
          MapService.getWmsGetCapabilities($scope.mapDatasource.url, function (data) {
            console.log('got em', data);
            $scope.fetchingCapabilities = false;
            $scope.mapDatasource.metadata.wmsGetCapabilities = data;
            $scope.showMap = true;
          });
        } else {
          $scope.showMap = true;
        }
        break;
      case 'arcgis':
        $scope.showMap = true;
        if ($scope.mapDatasource.metadata.wmsGetCapabilities.fullExtent && $scope.mapDatasource.metadata.wmsGetCapabilities.fullExtent.spatialReference && $scope.mapDatasource.metadata.wmsGetCapabilities.fullExtent.spatialReference.wkid && ($scope.mapDatasource.metadata.wmsGetCapabilities.fullExtent.spatialReference.wkid === 102100 || $scope.mapDatasource.metadata.wmsGetCapabilities.fullExtent.spatialReference.wkid === 102113 || $scope.mapDatasource.metadata.wmsGetCapabilities.fullExtent.spatialReference.wkid === 3857)) {
          var ll = proj4('EPSG:3857', 'EPSG:4326', [$scope.mapDatasource.metadata.wmsGetCapabilities.fullExtent.xmin, $scope.mapDatasource.metadata.wmsGetCapabilities.fullExtent.ymin]);
          var ur = proj4('EPSG:3857', 'EPSG:4326', [$scope.mapDatasource.metadata.wmsGetCapabilities.fullExtent.xmax, $scope.mapDatasource.metadata.wmsGetCapabilities.fullExtent.ymax]);
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
