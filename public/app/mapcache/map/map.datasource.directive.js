require('../../filters');
require('../../../vendor/angular-ui-select');

module.exports = function mapDatasource() {
  var directive = {
    restrict: "A",
    replace: true,
    templateUrl: 'app/mapcache/map/map-datasource.html',
    scope: {
      mapDatasource: '='
    },
    controller: 'MapDatasourceController'
  };

  return directive;
};
