var exports = module.exports;

exports.wmsGetCapabilities = {
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
};
