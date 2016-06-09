var mongoose = require('mongoose')
  , config = require('mapcache-config')
  , Feature = require('./feature')
  , async = require('async')
  , shortid = require('shortid');

// Creates a new Mongoose Schema object
var Schema = mongoose.Schema;

var StyleSchema = new Schema({
  fill: { type: String, required: false },
  'fill-opacity': { type: Number, required: false },
  stroke: { type: String, required: false},
  'stroke-opacity': { type: Number, required: false},
  'stroke-width': { type: Number, required: false}
});

var DatasourceSchema = new Schema({
  name: { type: String, required: false },
  url: { type: String, required: false },
  format: { type: String, required: true},
  projection: { type: String, required: false},
  vector: { type: Boolean, required: false, default: false},
  metadata: Schema.Types.Mixed,
  geometry: Schema.Types.Mixed,
  layers: [{
    name: { type: String, required: false},
    zOrder: { type: Number, required: false, default: 1 },
    vector: { type: Boolean, required: false, default: false},
    id: { type: Number, required: true}
  }],
  file: {
    name: { type: String, required: false},
    path: { type: String, required: false}
  },
  scaledFiles: [{
    resolution: { type: Number, required: true},
    path: { type: String, required: true}
  }],
  size: { type: Number, required: false},
  tilesLackExtensions: {type: Boolean, default: false},
  zOrder: { type: Number, required: false, default: -1},
  status: {
    message: { type: String, required: false},
    complete: {type: Boolean, required: true, default: false},
    totalFeatures: {type: Number, required: false, default: 0},
    generatedFeatures: { type: Number, required: false, default: 0},
    failure: { type: Boolean, required: false, default: false}
  },
  style: {required: false, type: {
    defaultStyle: {
      style: {
        fill: { type: String, required: false },
        'fill-opacity': { type: Number, required: false },
        stroke: { type: String, required: false},
        'stroke-opacity': { type: Number, required: false},
        'stroke-width': { type: Number, required: false}
      }
    },
    title: { type: String, required: false },
    description: { type: String, required: false},
    styles: {type: [StyleSchema], required: false }
  }},
  styleTime: { type: Number, required: false, default: 1 }
});

var SourceSchema = new Schema({
	name: { type: String, required: false },
  dataSources: [DatasourceSchema],
	projection: { type: String, required: false},
  size: { type: Number, required: false},
  tileSizeCount: { type: Number, required: false},
  tileSize: { type: Number, required: false, default: 0},
	humanReadableId: { type: String, required: false},
	geometry: Schema.Types.Mixed,
  style: Schema.Types.Mixed,
  properties: Schema.Types.Mixed,
  styleTime: { type: Number, required: false, default: 1 },
	projections: Schema.Types.Mixed,
  status: {
    message: { type: String, required: false},
		complete: {type: Boolean, required: true, default: false},
		totalTiles: {type: Number, required: true, default: 0},
		generatedTiles: {type: Number, required: true, default: 0},
		totalFeatures: {type: Number, required: true, default: 0},
		generatedFeatures: {type: Number, required: true, default: 0},
		zoomLevelStatus: Schema.Types.Mixed
	},
  tilesLackExtensions: {type: Boolean, default: false},
  format: { type: String, required: false},
  filePath: { type: String, required: false},
  vector: { type: Boolean, required: false},
  wmsGetCapabilities: Schema.Types.Mixed,
  wmsLayer: Schema.Types.Mixed,
  url: { type: String, required: false },
  userId: {type: Schema.Types.ObjectId, required: false, sparse: true},
  permission: {type: String, required: false}
});

function transform(source, ret) {
	ret.id = ret._id;
	delete ret._id;
	delete ret.__v;
  ret.mapcacheUrl = ['/api/sources', source.id].join("/");
  ret.cacheTypes = [];
  ret.permission = source.permission || 'MAPCACHE';
  if (ret.dataSources) {
    var addVectorSources = false;
    var addRasterSources = false;
    ret.dataSources.forEach(function(ds) {
      if (ds.vector) {
        addVectorSources = true;
        addRasterSources = true;
      } else {
        addRasterSources = true;
      }
    });
    if (addVectorSources) {
      var vectorTypes = config.sourceCacheTypes.vector;
      vectorTypes.forEach(function(type) {
        ret.cacheTypes.push(type);
      });
    }
    if (addRasterSources) {
      var rasterTypes = config.sourceCacheTypes.raster;
      rasterTypes.forEach(function(type) {
        ret.cacheTypes.push(type);
      });
    }
  }
}

function transformDatasource(source, ret) {
	ret.id = ret._id;
	delete ret._id;
	delete ret.__v;
}

function transformDatasourceToObject(source, ret) {
	ret.id = ret._id;
}

DatasourceSchema.set("toJSON", {
  transform: transformDatasource
});

DatasourceSchema.set('toObject', {
  transform: transformDatasourceToObject
});

SourceSchema.set("toJSON", {
  transform: transform
});

SourceSchema.set('toObject', {
  transform: transform
});

var Source = mongoose.model('Source', SourceSchema);

exports.sourceModel = Source;

exports.getSources = function(options, callback) {
  var userId = options.userId;
  delete options.userId;
  var query = options || {};
  if (userId) {
    query.$or = [{
      $and: [
        {userId: userId},
        {permission: 'USER'}
      ]
    }, {
      permission: { $exists: false }
    }, {
      permission: 'MAPCACHE'
    }];
  }
	Source.find(query).exec(function(err, sources) {
    if (err) {
      console.log("Error finding sources in mongo, error: " + err);
    }
    callback(err, sources);
  });
};

exports.updateSourceAverageSize = function(source, size) {
  console.log('updating tile size with params %s %s', source._id, size.toString());
  var update = {};
  if (!source.tileSizeCount) {
    update.$inc = {
      tileSizeCount: 1,
      tileSize: size
    };
  } else {
    update.tileSizeCount = 1;
    update.tileSize = size;
  }
  Source.findByIdAndUpdate(source._id, update).exec();
};

exports.getSourceById = function(id, callback) {
  Source.findById(id).exec(function(err, source) {
    if (err) {
      console.log("Error finding source in mongo: " + id + ', error: ' + err);
    }
		if (source) {
      source = source.toObject();
      async.eachSeries(source.dataSources, function(ds, dsDone) {
        if (ds.vector) {
          Feature.getAllPropertiesFromSource({sourceId: ds.id}, function(properties) {
            if (properties.length) {
              ds.properties = properties;
            }
            dsDone();
          });
        } else {
          dsDone();
        }
      }, function() {
  	    return callback(err, source);
      });
		} else {
  		// try to find by human readable
  		Source.findOne({humanReadableId: id}, function(err, source) {
        if (source) {
          source = source.toObject();
          async.eachSeries(source.dataSources, function(ds, dsDone) {
            if (ds.vector) {
              Feature.getAllPropertiesFromSource({sourceId: ds._id}, function(properties) {
                if (properties.length) {
                  ds.properties = properties;
                }
                dsDone();
              });
            } else {
              dsDone();
            }
          }, function() {
            source.cacheTypes = config.sourceCacheTypes[source.format];
      	    return callback(err, source);
          });
        } else {
    		  return callback(err, source);
        }
  		});
    }
  });
};

exports.getSourceByDatasourceId = function(id, callback) {
  var dataSource = {"dataSources": {"$elemMatch": {_id: id}}};
  Source.findOne(dataSource, function(err, source) {
    if (err) return callback(err);
    callback(err, source);
  });
};

exports.getDataSourceById = function(id, callback) {

  var dataSource = {"dataSources": {"$elemMatch": {_id: id}}};
  var fields = {dataSources: true};
  Source.findOne(dataSource, fields, function(err, source) {
    if (err) return callback(err);
    if (!source.dataSources || !source.dataSources.length) return callback(err, null);

    for (var i = 0; i < source.dataSources.length; i++) {
      if (source.dataSources[i]._id.toString() === id) {
        return callback(null, source.dataSources[i]);
      }
    }
    callback(err, null);
  });
};

exports.getSourceNoProperties = function(id, callback) {
  Source.findById(id, {properties: 0}).exec(function(err, source) {
    if (err) {
      console.log("Error finding source in mongo: " + id + ', error: ' + err);
    }
    return callback(err, source);
  });
};

exports.updateDataSource = function(sourceId, dataSource, callback) {
  console.log('update datasource %s', sourceId, dataSource);

  exports.getSourceById(sourceId, function(err, source) {
    console.log('source that i found', JSON.stringify(source, null, 2));
    console.log('dataSource._id', dataSource._id);
    for (var i = 0; i < source.dataSources.length; i++) {
      console.log('looking at ds %s', source.dataSources[i].id, source.dataSources[i]);
      if (source.dataSources[i].id === dataSource.id) {
        var ds = source.dataSources[i];
        console.log('ds', ds);
        for(var k in dataSource) ds[k]=dataSource[k];
      }
    }
    source.save(callback);
  });
};

exports.updateSource = function(id, update, callback) {
  update.styleTime = Date.now();
  for (var i = 0; i < update.dataSources.length; i++) {
    update.dataSources[i]._id = update.dataSources[i].id;
  }
  Source.findByIdAndUpdate(id, update, function(err, updatedSource) {
    if (err) return console.log('Could not update source', err);
    exports.getSourceById(id, function(err, retrievedSource) {
      callback(err, retrievedSource);
    });
  });
};

exports.createSource = function(source, callback) {
	source.humanReadableId = shortid.generate();
	Source.create(source, callback);
};

exports.deleteSource = function(source, callback) {
	Source.remove({_id: source.id}, callback);
};

exports.deleteDataSource = function(source, dataSourceId, callback) {
  var dataSource = {
    '_id': dataSourceId
  };
  source.update({'$pull': {dataSources: dataSource}}, function(err, number) {
    console.log('Removing the datasource %s number %d', dataSourceId, number);
    callback(err);
  });
};
