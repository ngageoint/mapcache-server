/*global L*/
var $ = require('jquery');

(function (window, document, undefined) {

L.Control.AtlasGeocoder = L.Control.extend({
	options: {
		position: 'topright',
		enabled: true
	},

	onAdd: function (map) {
    var geojsonLayer = L.geoJson(undefined, {
      onEachFeature: function (feature, layer) {
        layer.bindPopup(feature.place_name);
      }
    });
    geojsonLayer.addTo(map);
		var container = L.DomUtil.create('div', 'leaflet-control leaflet-control-geocode-search');
    L.DomEvent.disableClickPropagation(container);
    var searchInput = L.DomUtil.create('input', '', container);
    var clear = $('<span class="clear-geocode-search">&#x2718;</span>');
    $(container).append(clear);

    var suggestions = $('<div class="geocode-suggestions"></div>');

    $(container).append(suggestions);

    map.on('click', function() {
        suggestions.empty();
        suggestions.hide();
    });

    $(clear).click(function() {
      $(searchInput).val('');
      geojsonLayer.clearLayers();
      suggestions.hide();
    });
    $(searchInput).on('keyup', function() {
      var search = encodeURIComponent($(searchInput).val()).replace(/%20/g, "+");
      $.ajax('http://mapbox.geointapps.org:2999/v4/geocode/mapbox.places/'+search+'.json')
      .done(function(data) {
        geojsonLayer.clearLayers();
        geojsonLayer.addData(data);
        suggestions.empty();
        suggestions.hide();
        for(var i = 0; i < data.features.length; i++) {
          var suggestion = $('<div class="geocode-suggestion one-line-ellipsis">'+data.features[i].place_name+'</div>');
          suggestion.on('click', function() {
            var result = $(this).text();
            geojsonLayer.eachLayer(function(layer) {
              if (layer.feature.place_name === result) {
                layer.openPopup();
              }
            });
          });
          suggestions.append(suggestion);
          suggestions.show();
        }
      });
    });
    return container;
  }
});

}(this, document));
