angular
  .module('mapcache')
  .factory('SourceService', SourceService);

SourceService.$inject = ['$q', '$http', '$rootScope', 'LocalStorageService'];

function SourceService($q, $http, $rootScope, LocalStorageService) {

  var resolvedSources = {};
  var resolveAllSources = null;

  var service = {
    getAllSources: getAllSources,
    refreshSource: refreshSource,
    createSource: createSource
  };

  return service;

  function getAllSources(forceRefresh) {
    if (forceRefresh) {
        resolvedSources = {};
        resolveAllSources = undefined;
    }

    resolveAllSources = resolveAllSources || $http.get('/api/sources').success(function(sources) {
      for (var i = 0; i < sources.length; i++) {
        resolvedSources[sources[i]._id] = $q.when(sources[i]);
      }
    });

    return resolveAllSources;
  };

  function refreshSource(source, success, error) {
    $http.get('/api/sources/'+source.id)
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

  function createSource(source, success, error, progress) {

    if (source.sourceFile) {
        var formData = new FormData();
        formData.append('sourceFile', source.sourceFile);
        for (var key in source) {
          if (source.hasOwnProperty(key) && key != 'sourceFile' ) {
            formData.append(key, source[key]);
          }
        }

        $.ajax({
          url: '/api/sources',
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

            // delete self.formArchiveFile;
            // _.extend(self, response);
            // $rootScope.$apply(function() {
            //   success(self);
            // });
          },
          error: error,
          data: formData,
          cache: false,
          contentType: false,
          processData: false
        });
      } else {
        $http.post(
          '/api/sources',
          source,
          {headers: {"Content-Type": "application/json"}}
        ).success(function(source) {
          console.log("created a source", source);
          if (success) {
            success(source);
          }
        }).error(error);
      }
  };
}
