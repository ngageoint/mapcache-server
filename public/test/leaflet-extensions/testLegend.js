var L = require('leaflet');
var $ = require('jquery');

describe('Leaflet Legend Test', function() {

  var map
    , legend
    , mapContainer;

  var styles = {
    styles: [{
      style:{
        'fill': "#000000",
        'fill-opacity': 0.5,
        'stroke': "#0000FF",
        'stroke-opacity': 1.0,
        'stroke-width': 1
      },
      key: 'key',
      value: 'value'
    },{
      style: {
        'fill': "#FFFFFF",
        'fill-opacity': 0.5,
        'stroke': "#FFFFFF",
        'stroke-opacity': 1.0,
        'stroke-width': 1
      },
      key: 'key2',
      value: 'value2'
    }]
  };

  beforeEach(function() {
		mapContainer = L.DomUtil.create('div', '', document.body);
	  var fullSize = [document.querySelector("html"), document.body, mapContainer];

		map = new L.Map(mapContainer).setView([41.7896,-87.5996], 15);

		/* Map and its containing elements need to have height and width set. */
		for (var i = 0, l = fullSize.length; i < l; i++) {
			fullSize[i].style.width = '100%';
			fullSize[i].style.height = '100%';
		}

    legend = new L.Control.Legend(styles, {name: 'Name'});
    map.addControl(legend);
	});

  it('should ensure the legend examples were added', function() {
    var legend = $(mapContainer).find('.legend');
    var canvases = $(legend).find('canvas');
    canvases.length.should.be.equal(2);
  });

  it('should ensure the legend was toggled off', function() {
    var legend = $(mapContainer).find('.legend');
    $(legend).find('a').trigger('click');
    var canvases = $(legend).find('canvas');
    canvases.length.should.be.equal(0);
  });

  it('should ensure the legend was toggled off and back on', function() {
    var legend = $(mapContainer).find('.legend');
    $(legend).find('a').trigger('click');
    var canvases = $(legend).find('canvas');
    canvases.length.should.be.equal(0);
    $(legend).find('a').trigger('click');
    canvases = $(legend).find('canvas');
    canvases.length.should.be.equal(2);
  });
});
