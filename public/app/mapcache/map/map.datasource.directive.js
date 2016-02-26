require('../../filters');
require('../../../vendor/angular_ui_select');
var L = require('leaflet');
// L.Icon.Default.imagePath = 'public/node_modules/leaflet/dist/images/';

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
