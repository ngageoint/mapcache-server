L.Control.ZoomIndicator = L.Control.extend({
	options: {
		position: 'topleft',
		enabled: true
	},

	onAdd: function (map) {
		var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-zoom-indicator');
    this._link = L.DomUtil.create('a', '', container);
    this._link.innerHTML = map.getZoom();
    map.on('zoomend', function(event) {
      this._link.innerHTML = map.getZoom();
    }, this);

    return container;
  }
});
