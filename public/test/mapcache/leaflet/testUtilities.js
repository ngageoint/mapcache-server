var should = require('chai').should()
  , angular = require('angular')
  , mocks = require('../../mocks')
  , sinon  = require('sinon');

require('angular-mocks');

describe('Leaflet Utilities tests', function() {

  var LeafletUtilities;
  var map;

  var styles = {
    defaultStyle: {
      style: {
        'fill': "#CCCCCC",
        'fill-opacity': 0.5,
        'stroke': "#CCCCCC",
        'stroke-opacity': 1.0,
        'stroke-width': 1

      }
    },
    title: 'key',
    description: 'descKey',
    styles: [{
      style:{
        'fill': "#000000",
        'fill-opacity': 0.5,
        'stroke': "#0000FF",
        'stroke-opacity': 1.0,
        'stroke-width': 1
      },
      key: 'key',
      value: 'value',
      priority: 0
    },{
      style: {
        'fill': "#FFFFFF",
        'fill-opacity': 0.5,
        'stroke': "#FFFFFF",
        'stroke-opacity': 1.0,
        'stroke-width': 1
      },
      key: 'key',
      value: 'value2',
      priority: 1
    }]
  };

  var sandbox;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  beforeEach(function() {
    var mapContainer = L.DomUtil.create('div', '', document.body);
    var fullSize = [document.querySelector("html"), document.body, mapContainer];

    map = new L.Map(mapContainer).setView([41.7896,-87.5996], 15);

    /* Map and its containing elements need to have height and width set. */
    for (var i = 0, l = fullSize.length; i < l; i++) {
      fullSize[i].style.width = '100%';
      fullSize[i].style.height = '100%';
    }
  });

  beforeEach(angular.mock.module('mapcache'));

  beforeEach(inject(function(_LeafletUtilities_){
    LeafletUtilities = _LeafletUtilities_;
  }));

  it('should create the LeafletUtilities', function() {
    should.exist(LeafletUtilities);
  });

  it('should return the correct style for the feature value', function() {
    var style = LeafletUtilities.styleFunction({properties:{'key': 'value'}}, styles);
    style.should.be.deep.equal({
      fillColor: "#000000",
      fillOpacity: 0.5,
      color: "#0000FF",
      opacity: 1.0,
      weight: 1
    });
  });

  it('should return the correct style for the feature value2', function() {
    var style = LeafletUtilities.styleFunction({properties:{'key': 'value2'}}, styles);
    style.should.be.deep.equal({
      fillColor: "#FFFFFF",
      fillOpacity: 0.5,
      color: "#FFFFFF",
      opacity: 1.0,
      weight: 1
    });
  });

  it('should return the default style for the feature', function() {
    var style = LeafletUtilities.styleFunction({properties: {'key': 'default'}}, styles);
    style.should.be.deep.equal({
      fillColor: "#CCCCCC",
      fillOpacity: 0.5,
      color: "#CCCCCC",
      opacity: 1.0,
      weight: 1
    });
  });

  it('should bind the popup with description', function() {
    var layer = {
      bindPopup: sandbox.spy()
    };

    LeafletUtilities.popupFunction({properties:{'key': 'value', 'descKey':'description'}}, layer, styles);

    layer.bindPopup.calledOnce.should.be.equal(true);
    layer.bindPopup.alwaysCalledWithExactly('value description').should.be.equal(true);
  });

  it('should bind the popup without description', function() {
    var layer = {
      bindPopup: sandbox.spy()
    };

    LeafletUtilities.popupFunction({properties:{'key': 'value', 'nope':'description'}}, layer, styles);

    layer.bindPopup.calledOnce.should.be.equal(true);
    layer.bindPopup.alwaysCalledWithExactly('value ').should.be.equal(true);
  });

  it('should add the datasources to the layer control', function() {
    var layerControl = {
      addOverlay: sandbox.spy()
    };

    LeafletUtilities.addDatasourcesToLayerControl(mocks.mapMocks.xyzMap.dataSources, layerControl, map);
    layerControl.addOverlay.callCount.should.be.equal(mocks.mapMocks.xyzMap.dataSources.length);
  });

  it('should get the tile layer from a mapcacheUrl', function() {
    var map = mocks.mapMocks.xyzMap;
    var layerOptions = {maxZoom: 18, minZoom: 0};

    var expectedUrl = map.mapcacheUrl+'/{z}/{x}/{y}.png?access_token=null&_dc='+map.styleTime;
    for (var i = 0; i < map.dataSources.length; i++) {
      expectedUrl += '&dataSources[]='+map.dataSources[i].id;
    }

    var mock = sandbox.mock(L).expects('tileLayer')
      .once()
      .withArgs(expectedUrl, layerOptions);

    var layer = LeafletUtilities.tileLayer(mocks.mapMocks.xyzMap, 'http://example.com/default', layerOptions, {}, LeafletUtilities.styleFunction, map.dataSources);

    mock.verify();
  });

  it('should get the default tile layer', function() {
    var map = mocks.mapMocks.xyzMap;
    var layerOptions = {maxZoom: 18, minZoom: 0};
    var mock = sandbox.mock(L).expects('tileLayer')
      .once()
      .withArgs('http://example.com/default', layerOptions);
    LeafletUtilities.tileLayer(null, 'http://example.com/default', layerOptions);
  });

  it('should get a tile layer for a string url', function() {
    var url = 'http://example.com/layer';
    var layerOptions = {maxZoom: 18, minZoom: 0};
    var mock = sandbox.mock(L).expects('tileLayer')
      .once()
      .withArgs('http://example.com/layer/{z}/{x}/{y}', layerOptions);
    LeafletUtilities.tileLayer(url, 'http://example.com/default', layerOptions);
  });

  it('should get a tile layer for a wms data source', function() {
    var ds = mocks.mapMocks.wmsDatasource;
    var layerOptions = {maxZoom: 18, minZoom: 0};
    var mock = sandbox.mock(L.tileLayer).expects('wms')
      .once()
      .withArgs('http://watzmann.geog.uni-heidelberg.de/cached/osm', {
        format: "image/png",
        layers: "europe_wms:hs_srtm_europa",
        transparent: true,
        version: "1.1.1",
        maxZoom: 18,
        minZoom: 0
      });
    LeafletUtilities.tileLayer(ds, 'http://example.com/default', layerOptions);
  });

  it('should get a tile layer for a wms data source', function() {
    var ds = JSON.parse(JSON.stringify(mocks.mapMocks.wmsDatasource));
    delete ds.metadata;
    var layerOptions = {maxZoom: 18, minZoom: 0};
    var mock = sandbox.mock(L).expects('tileLayer')
      .once()
      .withArgs('http://example.com/default', layerOptions);
    LeafletUtilities.tileLayer(ds, 'http://example.com/default', layerOptions);
  });

  it('should get a tile layer for an opaque wms data source', function() {
    var ds = JSON.parse(JSON.stringify(mocks.mapMocks.wmsDatasource));
    ds.metadata.wmsLayer.opaque = true;
    var layerOptions = {maxZoom: 18, minZoom: 0};
    var mock = sandbox.mock(L).expects('tileLayer')
      .once()
      .withArgs('http://example.com/default', layerOptions);
    LeafletUtilities.tileLayer(ds, 'http://example.com/default', layerOptions);
  });

  it('should get the arcgis url', function() {
    var ds = mocks.mapMocks.arcgisDatasource;
    var layerOptions = {maxZoom: 18, minZoom: 0};
    var mock = sandbox.mock(L).expects('tileLayer')
      .once()
      .withArgs(ds.metadata.wmsGetCapabilities.tileServers[0]+'/tile/{z}/{y}/{x}', layerOptions);
    LeafletUtilities.tileLayer(ds, 'http://example.com/default', layerOptions);
  });

  it('should get the layer from a url', function() {
    var ds = {
      url: 'http://example.com/layer'
    };
    var layerOptions = {maxZoom: 18, minZoom: 0};
    var mock = sandbox.mock(L).expects('tileLayer')
      .once()
      .withArgs('http://example.com/layer/{z}/{x}/{y}.png', layerOptions);
    LeafletUtilities.tileLayer(ds, 'http://example.com/default', layerOptions);
  });

  it('should get the layer from a url with a wms layer', function() {
    var ds = {
      url: 'http://example.com/layer',
      metadata: {
        wmsLayer: {
          Name: 'wmsName'
        }
      }
    };
    var layerOptions = {maxZoom: 18, minZoom: 0};
    var mock = sandbox.mock(L).expects('tileLayer')
      .once()
      .withArgs('http://example.com/layer/{z}/{x}/{y}.png&layer=wmsName', layerOptions);
    LeafletUtilities.tileLayer(ds, 'http://example.com/default', layerOptions);
  });

  it('should get the tile layer from a mapcacheUrl with a layer name specified', function() {
    var map = JSON.parse(JSON.stringify(mocks.mapMocks.xyzMap));
    var layerOptions = {maxZoom: 18, minZoom: 0};

    var expectedUrl = map.mapcacheUrl+'/{z}/{x}/{y}.png?access_token=null&_dc='+map.styleTime;
    for (var i = 0; i < map.dataSources.length; i++) {
      expectedUrl += '&dataSources[]='+map.dataSources[i].id;
    }

    var mock = sandbox.mock(L).expects('tileLayer')
      .once()
      .withArgs(expectedUrl, layerOptions);

    var layer = LeafletUtilities.tileLayer(mocks.mapMocks.xyzMap, 'http://example.com/default', layerOptions, {}, LeafletUtilities.styleFunction, map.dataSources);

    mock.verify();
  });

  it('should get the default tile layer because something is wrong with the url', function() {
    var layerOptions = {maxZoom: 18, minZoom: 0};
    var mock = sandbox.mock(L).expects('tileLayer')
      .once()
      .withArgs('http://example.com/default', layerOptions);
    LeafletUtilities.tileLayer(6, 'http://example.com/default', layerOptions);
  });

  it('should get the layer from a url where tiles lack extensions', function() {
    var ds = {
      url: 'http://example.com/layer',
      tilesLackExtensions: true
    };
    var layerOptions = {maxZoom: 18, minZoom: 0};
    var mock = sandbox.mock(L).expects('tileLayer')
      .once()
      .withArgs('http://example.com/layer/{z}/{x}/{y}', layerOptions);
    LeafletUtilities.tileLayer(ds, 'http://example.com/default', layerOptions);
  });

});
