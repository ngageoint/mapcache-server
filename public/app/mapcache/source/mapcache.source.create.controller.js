angular
  .module('mapcache')
  .controller('MapcacheSourceCreateController', MapcacheSourceCreateController);

MapcacheSourceCreateController.$inject = [
  '$scope',
  '$location',
  '$timeout',
  '$http',
  'CacheService',
  'SourceService'
];

function MapcacheSourceCreateController($scope, $location, $timeout, $http, CacheService, SourceService) {

  $scope.validUrlFormats = [{format:'geojson'}, {format:'xyz'}, {format:'tms'}, {format:'wms'}];
  $scope.validFileFormats = [{format:'geotiff'}, {format:'mbtiles'}, {format:'geojson'}, {format:'shapefile'}, {format:'kmz'}, {format: 'mrsid'}];

  $scope.source = {
  };

  $scope.mapOptions = {
    baseLayerUrl: 'http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png',
    opacity: .14
  };

  var uploadProgress = function(e) {
    if(e.lengthComputable){
      $scope.$apply(function() {
        $scope.progress = (e.loaded/e.total) * 100;
        console.log('uploadprogress ' + $scope.progress);
      });
    }
  }

  function pruneSource(s) {
    // s.dataSources = s.dataSources || [];
    // s.dataSources.push({
    //   url: s.url,
    //   filePath: s.filePath,
    //   format: s.format,
    //   zOrder: 0,
    //   wmsGetCapabilities: s.wmsGetCapabilities
    // });
    delete s.previewLayer;
    delete s.wmsGetCapabilities;
  }

  $scope.createSource = function() {
    console.log($scope.cache);
    $scope.sourceSubmitted = true;
    pruneSource($scope.source);
    SourceService.createSource($scope.source, function(source) {
      console.log('source created', source);
      // now start a timer to watch the source be created
      $location.path('/source/'+source.id);
    }, function() {
      console.log("error");
    }, uploadProgress);
  }

  $scope.$on('uploadFile', function(e, uploadFile) {
    console.log('upload file is', uploadFile);
    $scope.locationStatus = 'success';
    $scope.sourceInformation = {
      file: {
        name: uploadFile.name
      }
    };
    delete $scope.source.url;
    delete $scope.source.format;
    $scope.source.sourceFile = uploadFile;

    var fileType = uploadFile.name.split('.').pop().toLowerCase();
    switch(fileType) {
      case 'tif':
      case 'tiff':
      case 'geotiff':
      case 'geotif':
        $scope.sourceInformation.format = 'geotiff';
        $scope.source.format = 'geotiff';
        break;
      case 'sid':
        $scope.sourceInformation.format = 'mrsid';
        $scope.source.format = 'mrsid';
        break;
      case 'mbtiles':
        $scope.sourceInformation.format = 'mbtiles';
        $scope.source.format = 'mbtiles';
        break;
      case 'zip':
        $scope.sourceInformation.format = 'shapefile';
        $scope.source.format = 'shapefile';
        break;
      case 'kmz':
        $scope.sourceInformation.format = 'kmz';
        $scope.source.format = 'kmz';
        break;
      case 'json':
      case 'geojson':
        $scope.sourceInformation.format = 'geojson';
        $scope.source.format = 'geojson';
        break;
    }

    console.log('source information')
  });

  function getSourceProgress() {
    SourceService.refreshSource($scope.source, function(source) {
      // success
      $scope.source = source;
      if (!source.complete) {
        $timeout(getSourceProgress, 5000);
      }
    }, function(data) {
      // error
    });
  }

  $scope.$watch('source.previewLayer', function(layer, oldLayer) {
    if (layer) {
      if (layer.EX_GeographicBoundingBox) {
        $scope.mapOptions.extent = layer.EX_GeographicBoundingBox;
      }
    }
  });

  $scope.$watch('sourceInformation', function(sourceInformation, oldSourceInformation) {
    if (!sourceInformation) {
      delete $scope.source.wmsGetCapabilities;
      return;
    }
  });

  $scope.$watch('sourceInformation.wmsGetCapabilities', function(capabilities, oldCapabilities) {
    if (capabilities) {
      $scope.wmsLayers = capabilities.Capability.Layer.Layer || [capabilities.Capability.Layer];
    } else {
      $scope.wmsLayers = [];
    }
  });

  $scope.$watch('source.format', function(format, oldFormat) {
    console.log('source fomrat', $scope.source.format);
    switch ($scope.source.format) {
      case 'wms':
        if (!$scope.sourceInformation.wmsGetCapabilities) {
          $scope.fetchingCapabilities = true;
          $http.get('/api/sources/wmsFeatureRequest',
          {
            params: {
              wmsUrl: $scope.source.url
            }
          }).success(function (data) {
            $scope.fetchingCapabilities = false;
            $scope.source.wmsGetCapabilities = $scope.sourceInformation.wmsGetCapabilities = data;
            $scope.showMap = true;
          });
        } else {
          $scope.source.wmsGetCapabilities = $scope.sourceInformation.wmsGetCapabilities;
        }
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
      $scope.sourceInformation = undefined;
      $scope.urlDiscovery = true;
      $scope.source.sourceFile = undefined;
      $scope.$broadcast('clearFile');
    });

    console.log('url is valid, what is it?');
    $http.get('/api/sources/discoverSource',
    {
      params: {
        url: $scope.source.url
      }
    }).success(function (data) {
      $scope.urlDiscovery = false;
      $scope.sourceInformation = data;
      if (data.format) {
        $scope.source.format = data.format;
      }

      if ($scope.sourceInformation.valid && !$scope.sourceInformation.format) {
        $scope.locationStatus = 'warning';
      } else if (!$scope.sourceInformation.valid) {
        $scope.locationStatus = 'error';
      } else {
        $scope.locationStatus = 'success';
      }
    }).error(function(err) {
      $scope.urlDiscovery = false;
      $scope.sourceInformation = undefined;
      $scope.locationStatus = undefined;
    });
  }, 500);

  $scope.$on('location-url', function(e, location) {
    if (!location) {
      $scope.sourceInformation = undefined;
      delete $scope.source.url;
      return;
    }
    $scope.urlDiscovery = true;
    $scope.source.url = location;
    urlChecker();
  });

};
