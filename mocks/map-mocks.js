var exports = module.exports;

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
  "tileSize":0,
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
    "id":"56a92d006a4c0e8d43c40195a"
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
    "id":"56a92d006a4c0e8d43c40195b"
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
      "path":"path/to/geojson.geojson",
      "name":"geojson.geojson"
    },
    "size":108,
    "format":"geojson",
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
    "vector":true,
    "id":"56a92d006a4c0e8d43c40195c"
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
  "tileSize":0,
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


exports.maps = [exports.xyzMap, exports.incompleteMap];
exports.completeMaps = [exports.xyzMap];
