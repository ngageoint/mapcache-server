var exports = module.exports;

exports.osmDatasource = {
  "geometry":{
    "type":"Feature",
    "geometry":{
      "type":"Polygon",
      "coordinates":[[[180,-85],[-180,-85],[-180,85],[180,85],[180,-85]]]
    }
  },
  "name":"osm",
  "url":"http://osm.geointapps.org/osm",
  "format":"xyz",
  "styleTime":1,
  "status":{
    "message":"Complete",
    "failure":false,
    "totalFeatures":0,
    "complete":true
  },
  "zOrder":0,
  "tilesLackExtensions":false,
  "scaledFiles":[],
  "layers":[],
  "vector":false,
  "id":"56a92d006a4c0e8d43c40195a"
};

// verify this
exports.arcgisDatasource = {
  format: 'arcgis',
  metadata: {
    wmsGetCapabilities: {
      tileServers: ['http://server1']
    }
  }
};

exports.geojsonDatasource = {
  "geometry": {
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            -115.525899779486,
            -31.1403304199038
          ],
          [
            -115.525899779486,
            73.1048807777633
          ],
          [
            123.377109149484,
            73.1048807777633
          ],
          [
            123.377109149484,
            -31.1403304199038
          ],
          [
            -115.525899779486,
            -31.1403304199038
          ]
        ]
      ]
    }
  },
  "name":"geojson",
  "file": {
    "path": 'path/to/maptest.geojson',
    "name": 'maptest.geojson'
  },
  "size":345727,
  "format":"geojson",
  "styleTime":1,
  "style": {
    "defaultStyle": {
      "style": {
				'fill': "#000000",
				'fill-opacity': 0.5,
				'stroke': "#0000FF",
				'stroke-opacity': 1.0,
				'stroke-width': 1
			}
    },
    "styles": []
  },
  properties: [
    { key: 'Scalerank', values: [ 4, 1, 5, 6, 2, 3 ] },
    {
      key: 'Name',
      values: [
        'Gan',
        'Orange',
        'Arkansas',
        'Ganale Doria',
        'Niagra',
        'Olenëk',
        'Garonne',
        'Ohio',
        'Niger',
        'Madeira',
        'Missouri',
        'Ayeyarwady',
        'Omo',
        'Meta',
        'Oder',
        'Mississippi',
        'Athabasca',
        'Atbara',
        'Nile',
        'Godävari',
        'Ganges'
      ]
    },
    { key: 'Name_alt', values: [ null ] }
  ],
  "status":{
    "message":"Complete",
    "failure":false,
    "totalFeatures":38,
    "complete":true
  },
  "zOrder":1,
  "tilesLackExtensions":false,
  "scaledFiles":[],
  "layers":[],
  "vector":true,
  "id":"56c25070a15afea0e094406c"
};

exports.xyzMap = {
  "name":"Cache Route Test",
  "humanReadableId":"4JbQ3GMte",
  "tilesLackExtensions":false,
  "status":{
    "message":"Completed map processing",
    "generatedFeatures":0,
    "totalFeatures":0,
    "generatedTiles":0,
    "totalTiles":0,
    "complete":true
  },
  "styleTime":1,
  "tileSize":50,
  "tileSizeCount":1,
  "dataSources":[exports.osmDatasource,exports.geojsonDatasource],
  "id":"56a92d006a4c0e8d43c40194",
  "mapcacheUrl":"/api/sources/56a92d006a4c0e8d43c40194",
  "cacheTypes":[
    { required: false, type: 'geojson', vector: true },
    { required: false, type: 'shapefile', vector: true },
    { required: false, type: 'kml', vector: true },
    { required: false, type: 'xyz' },
    { depends: 'xyz', required: false, type: 'tms' },
    { depends: 'xyz', required: false, type: 'geopackage' }
  ]
};

exports.incompleteMap = {
  "name":"Incomplete Map",
  "humanReadableId":"4JbQ3GMte",
  "tilesLackExtensions":false,
  "status":{
    "message":"map processing",
    "generatedFeatures":0,
    "totalFeatures":0,
    "generatedTiles":0,
    "totalTiles":0,
    "complete":false
  },
  "styleTime":1,
  "tileSize":50,
  "tileSizeCount":1,
  "dataSources":[{
    "geometry":{
      "type":"Feature",
      "geometry":{
        "type":"Polygon",
        "coordinates":[[[180,-85],[-180,-85],[-180,85],[180,85],[180,-85]]]
      }
    },
    "name":"osm",
    "url":"http://osm.geointapps.org/osm",
    "format":"xyz",
    "styleTime":1,
    "status":{
      "message":"Complete",
      "failure":false,
      "totalFeatures":0,
      "complete":true
    },
    "zOrder":0,
    "tilesLackExtensions":false,
    "scaledFiles":[],
    "layers":[],
    "vector":false,
    "id":"56a92d006a4c0e8d43c40195"
  },{
    "geometry":{
      "type":"Feature",
      "geometry":{
        "type":"Polygon",
        "coordinates":[[[180,-85],[-180,-85],[-180,85],[180,85],[180,-85]]]
      }
    },
    "name":"osm",
    "file":{
      "path":"path/to/geotiff.tiff",
      "name":"geotiff.tiff"
    },
    "size":108,
    "format":"geotiff",
    "styleTime":1,
    "status":{
      "message":"processing",
      "failure":false,
      "totalFeatures":0,
      "complete":false
    },
    "zOrder":0,
    "tilesLackExtensions":false,
    "scaledFiles":[],
    "layers":[],
    "vector":false,
    "id":"56a92d006a4c0e8d43c40195"
  }],
  "id":"56a92d006a4c0e8d43c40194",
  "mapcacheUrl":"/api/sources/56a92d006a4c0e8d43c40194",
  "cacheTypes":[{
    "type":"xyz",
    "required":false
  },{
    "type":"tms",
    "required":false,
    "depends":"xyz"
  },{
    "type":"geopackage",
    "required":false,
    "depends":"xyz"
  },{
    "type":"mbtiles",
    "required":false,
    "depends":"xyz"
  }]
};

exports.wmsDatasource = {
  "zOrder": 0,
  "url": "http://watzmann.geog.uni-heidelberg.de/cached/osm",
  "format": "wms",
  "valid": true,
  "name": "http://watzmann.geog.uni-heidelberg.de/cached/osm",
  "status":{
    "message":"Complete",
    "failure":false,
    "totalFeatures":0,
    "complete":true
  },
  metadata: {
    "wmsGetCapabilities": {
      "version": "1.1.1",
      "Service": {
        "Name": "OGC:WMS",
        "Title": "OSM-WMS Uni Heidelberg",
        "Abstract": "Cached WMS with OpenStreetMap Data",
        "OnlineResource": "http://osm-wms.de",
        "ContactInformation": {
          "ContactPersonPrimary": {
            "ContactPerson": "Michael Auer",
            "ContactOrganization": "University of Heidelberg, Department of Geography, Chair of GIScience Prof. Zipf"
          },
          "ContactPosition": "Reseach Assistant",
          "ContactAddress": {
            "AddressType": "postal",
            "Address": "Berlinerstr. 48",
            "City": "Heidelberg",
            "StateOrProvince": "",
            "PostCode": "69120",
            "Country": "Germany"
          },
          "ContactVoiceTelephone": "",
          "ContactFacsimileTelephone": "",
          "ContactElectronicMailAddress": "auer@uni-heidelberg.de"
        },
        "Fees": "None",
        "AccessConstraints": "This service is intended for private and evaluation use only. Map data © OpenStreetMap contributors, CC BY-SA The data is licensed as Creative Commons Attribution-Share Alike 2.0 (http://creativecommons.org/licenses/by-sa/2.0/)"
      },
      "Capability": {
        "Request": {
          "GetCapabilities": {
            "Format": [
              "application/vnd.ogc.wms_xml"
            ],
            "DCPType": [
              {
                "HTTP": {
                  "Get": {
                    "OnlineResource": "http://watzmann.geog.uni-heidelberg.de/cached/osm/service?"
                  }
                }
              }
            ]
          },
          "GetMap": {
            "Format": [
              "image/gif",
              "image/png",
              "image/tiff",
              "image/jpeg",
              "image/GeoTIFF"
            ],
            "DCPType": [
              {
                "HTTP": {
                  "Get": {
                    "OnlineResource": "http://watzmann.geog.uni-heidelberg.de/cached/osm/service?"
                  }
                }
              }
            ]
          },
          "GetFeatureInfo": {
            "Format": [
              "text/plain",
              "text/html",
              "application/vnd.ogc.gml"
            ],
            "DCPType": [
              {
                "HTTP": {
                  "Get": {
                    "OnlineResource": "http://watzmann.geog.uni-heidelberg.de/cached/osm/service?"
                  }
                }
              }
            ]
          }
        },
        "Exception": [
          "application/vnd.ogc.se_xml",
          "application/vnd.ogc.se_inimage",
          "application/vnd.ogc.se_blank"
        ],
        "Layer": {
          "Title": "OSM-WMS Uni Heidelberg",
          "BoundingBox": [
            {
              "crs": "EPSG:900913",
              "extent": [
                -20037508.3428,
                -20037508.3428,
                20037508.3428,
                20037508.3428
              ],
              "res": [
                null,
                null
              ]
            },
            {
              "crs": "EPSG:4326",
              "extent": [
                -180,
                -85.0511287798,
                180,
                85.0511287798
              ],
              "res": [
                null,
                null
              ]
            },
            {
              "crs": "EPSG:3857",
              "extent": [
                -20037508.3428,
                -20037508.3428,
                20037508.3428,
                20037508.3428
              ],
              "res": [
                null,
                null
              ]
            }
          ],
          "Layer": [
            {
              "Name": "osm_auto:all",
              "Title": "OSM WMS - osm-wms.de",
              "BoundingBox": [
                {
                  "crs": "EPSG:900913",
                  "extent": [
                    -20037508.3428,
                    -20037508.3428,
                    20037508.3428,
                    20037508.3428
                  ],
                  "res": [
                    null,
                    null
                  ]
                },
                {
                  "crs": "EPSG:4326",
                  "extent": [
                    -180,
                    -85.0511287798,
                    180,
                    85.0511287798
                  ],
                  "res": [
                    null,
                    null
                  ]
                },
                {
                  "crs": "EPSG:3857",
                  "extent": [
                    -20037508.3428,
                    -20037508.3428,
                    20037508.3428,
                    20037508.3428
                  ],
                  "res": [
                    null,
                    null
                  ]
                }
              ],
              "queryable": false,
              "opaque": false,
              "noSubsets": false
            },
            {
              "Name": "europe_wms:hs_srtm_europa",
              "Title": "HILLSHADE WMS - osm-wms.de",
              "BoundingBox": [
                {
                  "crs": "EPSG:900913",
                  "extent": [
                    -20037508.3428,
                    -20037508.3428,
                    20037508.3428,
                    20037508.3428
                  ],
                  "res": [
                    null,
                    null
                  ]
                },
                {
                  "crs": "EPSG:4326",
                  "extent": [
                    -180,
                    -85.0511287798,
                    180,
                    85.0511287798
                  ],
                  "res": [
                    null,
                    null
                  ]
                },
                {
                  "crs": "EPSG:3857",
                  "extent": [
                    -20037508.3428,
                    -20037508.3428,
                    20037508.3428,
                    20037508.3428
                  ],
                  "res": [
                    null,
                    null
                  ]
                }
              ],
              "queryable": false,
              "opaque": false,
              "noSubsets": false
            }
          ]
        }
      }
    },
    "wmsLayer": {
      "Name": "europe_wms:hs_srtm_europa",
      "Title": "HILLSHADE WMS - osm-wms.de",
      "BoundingBox": [
        {
          "crs": "EPSG:900913",
          "extent": [
            -20037508.3428,
            -20037508.3428,
            20037508.3428,
            20037508.3428
          ],
          "res": [
            null,
            null
          ]
        },
        {
          "crs": "EPSG:4326",
          "extent": [
            -180,
            -85.0511287798,
            180,
            85.0511287798
          ],
          "res": [
            null,
            null
          ]
        },
        {
          "crs": "EPSG:3857",
          "extent": [
            -20037508.3428,
            -20037508.3428,
            20037508.3428,
            20037508.3428
          ],
          "res": [
            null,
            null
          ]
        }
      ],
      "queryable": false,
      "opaque": false,
      "noSubsets": false
    }
  }
};

exports.wmsMap = {
  "name":"Cache Route Test",
  "humanReadableId":"4JbQ3GMte",
  "tilesLackExtensions":false,
  "status":{
    "message":"Completed map processing",
    "generatedFeatures":0,
    "totalFeatures":0,
    "generatedTiles":0,
    "totalTiles":0,
    "complete":true
  },
  "styleTime":1,
  "tileSize":0,
  "dataSources":[exports.wmsDatasource],
  "id":"56a92d006a4c0e8d43c40194",
  "mapcacheUrl":"/api/sources/56a92d006a4c0e8d43c40194",
  "cacheTypes":[{
    "type":"xyz",
    "required":false
  },{
    "type":"tms",
    "required":false,
    "depends":"xyz"
  },{
    "type":"geopackage",
    "required":false,
    "depends":"xyz"
  },{
    "type":"mbtiles",
    "required":false,
    "depends":"xyz"
  }]
};


exports.maps = [exports.xyzMap, exports.incompleteMap, exports.wmsMap];
exports.completeMaps = [exports.xyzMap];

exports.featureMock =
[
  {
    "geometry": {
      "type": "Point",
      "coordinates": [
        -104.735363002878,
        39.83371877452
      ]
    },
    "properties": {
      "location": "PENA BLVD: e/o E-470",
      "avg_volume": 110000,
      "gid": 1,
      "mapcache_source_id": "56c25070a15afea0e094406c"
    }
  },
  {
    "geometry": {
      "type": "Point",
      "coordinates": [
        -104.735363002878,
        39.83371877452
      ]
    },
    "properties": {
      "location": "PENA BLVD: e/o E-470",
      "avg_volume": 101900,
      "gid": 2,
      "mapcache_source_id": "56c25070a15afea0e094406c"
    }
  },
  {
    "geometry": {
      "type": "Point",
      "coordinates": [
        -104.786213700181,
        39.8201366266901
      ]
    },
    "properties": {
      "location": "PENA BLVD: n/o 56th Ave",
      "avg_volume": 74300,
      "gid": 3,
      "mapcache_source_id": "56c25070a15afea0e094406c"
    }
  },
  {
    "geometry": {
      "type": "Point",
      "coordinates": [
        -104.786213700181,
        39.8201366266901
      ]
    },
    "properties": {
      "location": "PENA BLVD: n/o 56th Ave",
      "avg_volume": 73000,
      "gid": 4,
      "mapcache_source_id": "56c25070a15afea0e094406c"
    }
  },
  {
    "geometry": {
      "type": "Point",
      "coordinates": [
        -104.760402539071,
        39.833954477584
      ]
    },
    "properties": {
      "location": "PENA BLVD: e/o Tower Rd",
      "avg_volume": 88200,
      "gid": 5,
      "mapcache_source_id": "56c25070a15afea0e094406c"
    }
  },
  {
    "geometry": {
      "type": "Point",
      "coordinates": [
        -104.760402539071,
        39.833954477584
      ]
    },
    "properties": {
      "location": "PENA BLVD: e/o Tower Rd",
      "avg_volume": 75100,
      "gid": 6,
      "mapcache_source_id": "56c25070a15afea0e094406c"
    }
  },
  {
    "geometry": {
      "type": "Point",
      "coordinates": [
        -104.760402539071,
        39.833954477584
      ]
    },
    "properties": {
      "location": "PENA BLVD: e/o Tower Rd",
      "avg_volume": 82600,
      "gid": 7,
      "mapcache_source_id": "56c25070a15afea0e094406c"
    }
  },
  {
    "geometry": {
      "type": "Point",
      "coordinates": [
        -104.788349643079,
        39.7914240665285
      ]
    },
    "properties": {
      "location": "PENA BLVD: n/o 48th Ave",
      "avg_volume": 86100,
      "gid": 8,
      "mapcache_source_id": "56c25070a15afea0e094406c"
    }
  },
  {
    "geometry": {
      "type": "Point",
      "coordinates": [
        -104.788349643079,
        39.7914240665285
      ]
    },
    "properties": {
      "location": "PENA BLVD: n/o 48th Ave",
      "avg_volume": 87300,
      "gid": 9,
      "mapcache_source_id": "56c25070a15afea0e094406c"
    }
  },
  {
    "geometry": {
      "type": "Point",
      "coordinates": [
        -104.788349643079,
        39.7914240665285
      ]
    },
    "properties": {
      "location": "PENA BLVD: n/o 48th Ave",
      "avg_volume": 82700,
      "gid": 10,
      "mapcache_source_id": "56c25070a15afea0e094406c"
    }
  },
  {
    "geometry": {
      "type": "Point",
      "coordinates": [
        -104.790511864866,
        39.779246499841
      ]
    },
    "properties": {
      "location": "PENA BLVD: s/o 48th Ave",
      "avg_volume": 103400,
      "gid": 11,
      "mapcache_source_id": "56c25070a15afea0e094406c"
    }
  },
  {
    "geometry": {
      "type": "Point",
      "coordinates": [
        -104.790511864866,
        39.779246499841
      ]
    },
    "properties": {
      "location": "PENA BLVD: s/o 48th Ave",
      "avg_volume": 108900,
      "gid": 12,
      "mapcache_source_id": "56c25070a15afea0e094406c"
    }
  },
  {
    "geometry": {
      "type": "Point",
      "coordinates": [
        -104.790511864866,
        39.779246499841
      ]
    },
    "properties": {
      "location": "PENA BLVD: s/o 48th Ave",
      "avg_volume": 95400,
      "gid": 13,
      "mapcache_source_id": "56c25070a15afea0e094406c"
    }
  },
  {
    "geometry": {
      "type": "Point",
      "coordinates": [
        -105.322225101888,
        39.6192831022704
      ]
    },
    "properties": {
      "location": "CR-73: s/o Brook Forest Rd (CR-78)",
      "avg_volume": 7698,
      "gid": 14,
      "mapcache_source_id": "56c25070a15afea0e094406c"
    }
  },
  {
    "geometry": {
      "type": "Point",
      "coordinates": [
        -104.922892231054,
        39.5972279775711
      ]
    },
    "properties": {
      "location": "HOLLY ST: n/o Arapahoe Rd & s/o Forest Way",
      "avg_volume": 11668,
      "gid": 15,
      "mapcache_source_id": "56c25070a15afea0e094406c"
    }
  },
  {
    "geometry": {
      "type": "Point",
      "coordinates": [
        -104.923037501208,
        39.5674024250691
      ]
    },
    "properties": {
      "location": "HOLLY ST: n/o County Line & s/o Otero Ave",
      "avg_volume": 12141,
      "gid": 16,
      "mapcache_source_id": "56c25070a15afea0e094406c"
    }
  },
  {
    "geometry": {
      "type": "Point",
      "coordinates": [
        -105.091924760926,
        39.5662014485838
      ]
    },
    "properties": {
      "location": "CHATFIELD AVE: e/o Carr (Westmost int.)",
      "avg_volume": 10573,
      "gid": 17,
      "mapcache_source_id": "56c25070a15afea0e094406c"
    }
  },
  {
    "geometry": {
      "type": "Point",
      "coordinates": [
        -105.024750490293,
        39.6532683302174
      ]
    },
    "properties": {
      "location": "W. HAMPDEN AVE: e/o Federal Blvd (SH-88)",
      "avg_volume": 5468,
      "gid": 18,
      "mapcache_source_id": "56c25070a15afea0e094406c"
    }
  },
  {
    "geometry": {
      "type": "Point",
      "coordinates": [
        -105.025793801933,
        39.6532764806593
      ]
    },
    "properties": {
      "location": "W. HAMPDEN AVE: w/o Federal Blvd (SH-88)",
      "avg_volume": 3942,
      "gid": 19,
      "mapcache_source_id": "56c25070a15afea0e094406c"
    }
  }
];
