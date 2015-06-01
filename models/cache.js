var mongoose = require('mongoose')
	, fs = require('fs-extra')
	, config = require('../config.json')
	, hri = require('human-readable-ids').hri
	, Source = require('./source');

// Creates a new Mongoose Schema object
var Schema = mongoose.Schema;

var TileFailureSchema = new Schema({
	url: {type: String, required: true},
	retries: {type: Number, required: true},
	failureType: {type: Number, required: false}
});

// Creates the Schema for the cache objects
var CacheSchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: false },
  date: {type: Date, require: true },
	geometry: Schema.Types.Mixed,
	maxZoom: {type: Number, required: true, default: 0 },
	minZoom: {type: Number, required: true, default: 0},
	tileSizeLimit: { type: Number, required: false},
	totalTileSize: { type: Number, required: true, default: 0},
	humanReadableId: { type: String, required: false},
	cancel: { type: Boolean, required: true, default: false},
	formats: Schema.Types.Mixed,
	tileFailures: [TileFailureSchema],
	status: {
		complete: {type: Boolean, required: true, default: false},
		totalTiles: {type: Number, required: true, default: 0},
		generatedTiles: {type: Number, required: true, default: 0},
		totalFeatures: {type: Number, required: true, default: 0},
		generatedFeatures: {type: Number, required: true, default: 0},
		zoomLevelStatus: Schema.Types.Mixed
	},
	cacheCreationParams: Schema.Types.Mixed,
	style: Schema.Types.Mixed,
	vector: { type: Boolean, required: true, default: false},
	sourceId: { type: Schema.Types.ObjectId, ref: 'Source', required: true }/*,
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: false }*/
},{
	strict: true
});

CacheSchema.index({geometry: "2dsphere"});
CacheSchema.index({'name': 1});

function transform(cache, ret, options) {
	ret.id = ret._id;
	delete ret._id;

	delete ret.__v;

	if (cache.populated('sourceId')) {
		ret.source = ret.sourceId;
		if (ret.source) {
			ret.source.cacheTypes = config.sourceCacheTypes[ret.source.format];
		}
		delete ret.sourceId;
	}

	if (cache.populated('statusId')) {
		ret.status = ret.statusId;
		delete ret.status;
	}

	ret.mapcacheUrl = ['/api/caches', cache.id].join("/");
}

CacheSchema.set("toJSON", {
  transform: transform
});

var Cache = mongoose.model('Cache', CacheSchema);
exports.cacheModel = Cache;

function getSourceByUrlAndFormat(url, format, callback) {
  var query = {
	  'format': format,
		'url': url
  };
  Source.findOne(query).exec(function(err, source) {
    if (err) {
      console.log("Error finding cache in mongo: " + id + ', error: ' + err);
    }
    callback(err, source);
  });
}

exports.getCaches = function(callback) {
	var query = {};
	Cache.find(query).populate('sourceId').exec(function(err, caches) {
    if (err) {
      console.log("Error finding caches in mongo: " + id + ', error: ' + err);
    }
    callback(err, caches);
  });
}

exports.getCacheById = function(id, callback) {
  Cache.findById(id).populate('sourceId').exec(function(err, cache) {
    if (err) {
      console.log("Error finding cache in mongo: " + id + ', error: ' + err);
    }
		if (cache) {
			if (cache.sourceId) {
				cache.source = cache.sourceId;
				cache.source.cacheTypes = config.sourceCacheTypes[cache.source.format];
			}
	    return callback(err, cache);
		}
		// try to find by human readable
		Cache.findOne({humanReadableId: id}, function(err, cache) {
			if (cache) {
				cache.source = cache.sourceId;
				cache.source.cacheTypes = config.sourceCacheTypes[cache.source.format];
			}
		  return callback(err, cache);
		});
  });
}

exports.deleteFormat = function(cache, formatName, callback) {
	delete cache.formats[formatName];
	cache.markModified('formats');
	cache.save(callback);
}

exports.deleteCache = function(cache, callback) {
	Cache.remove({_id: cache.id}, callback);
}

exports.createCache = function(cache, callback) {
	Cache.findOne({name: cache.name}, function(err, duplicateCache) {
		if (duplicateCache) {
			return callback(new Error("Cache with this name already exists"));
		}
		if (cache.source) {
			cache.sourceId = cache.source.id;
			cache.humanReadableId = cache.humanReadableId || hri.random();
			Cache.create(cache, function(err, newCache) {
				if(err) return callback(err);
				Cache.findById(newCache._id).populate('sourceId').exec(function(err, cache) {
			    if (err) {
			      console.log("Error finding cache in mongo: " + id + ', error: ' + err);
			    }
					if (cache) {
						cache.source = cache.sourceId;
				    return callback(err, cache);
					}
				});
			});
			return;
		}
	});
}

exports.updateZoomLevelStatus = function(cache, zoomLevel, complete, callback) {
	var update = {$set: {}};
	update.$set['status.zoomLevelStatus.'+zoomLevel+'.complete'] = true;
	Cache.findByIdAndUpdate(cache.id, update, callback);
}

exports.updateTileDownloaded = function(cache, z, x, y, callback) {
	console.log('tile downloaded to ' + config.server.cacheDirectory.path + "/" + cache.id + '/' + z + '/' + x + '/' + y + '.png');
	fs.stat(config.server.cacheDirectory.path + "/" + cache.id + '/' + z + '/' + x + '/' + y + '.png', function(err, stat) {
		if (err) return callback(err);
		var update = {$inc: {}};
		update.$inc['totalTileSize'] = stat.size;
		update.$inc['status.zoomLevelStatus.'+z+'.generatedTiles'] = 1;
		update.$inc['status.generatedTiles'] = 1;
		update.$inc['status.zoomLevelStatus.'+z+'.size'] = stat.size;
		Cache.findByIdAndUpdate(cache.id, update, callback);
	});
}

exports.shouldContinueCaching = function(cache, callback) {
	Cache.aggregate(
		{ $group: { _id: null, aggTileSize: { $sum: "$totalTileSize"}}}
	, { $project: { _id: 0, aggTileSize: 1 }}
	, function(err, value) {
		// should pull this from the db in the future
		console.log('value', value);
		console.log('value.aggtilesize ' + value[0].aggTileSize + ' storage limit ' + config.server.storageLimit * 1024 * 1024);
		if (value[0].aggTileSize > config.server.storageLimit * 1024 * 1024) {
			return callback(null, false);
		}
		console.log("is cache " + cache.id + " cancelled?");
		Cache.findById(cache.id, function(err, foundCache) {
			if (err) return callback(err);
			if (foundCache.cancel) {
				console.log("foundCache.cancel");
				return callback(null, false);
			}
			if (!foundCache.tileSizeLimit) {
				console.log("!foundCache.tileSizeLimit");
				return callback(null, true);
			}
			if (foundCache.tileSizeLimit > foundCache.totalTileSize) {
				console.log("foundCache.tileSizeLimit > foundCache.totalTileSize");
				return callback(null, true);
			}

			return callback(null, false);
		});
	});
}

exports.updateFormatCreated = function(cache, formatName, formatFile, callback) {
	if( typeof formatFile === "function" && !callback) {
    callback = formatFile;
		formatFile = null;
  }
  callback = callback || function(){}
	// cache.formats = cache.formats || {};
	var formatArray = formatName;
	if (!Array.isArray(formatName)) {
		formatArray = [formatName];
	}
	var size = 0;
	if (typeof formatFile === 'string') {
		fs.stat(formatFile, function(err, stat) {
			if (err) {
				return callback(err);
			}
			size = stat.size;

			var update = {$set: {}};
			for (var i = 0; i < formatArray.length; i++) {
				update.$set['formats.'+formatArray[i]] = {size: size};
			}
			Cache.findByIdAndUpdate(cache.id, update, callback);
		});
	} else {
		var update = {$set: {}};
		for (var i = 0; i < formatArray.length; i++) {
			update.$set['formats.'+formatArray[i]] = {size: typeof formatFile === 'number' ? formatFile : 0};
		}
		Cache.findByIdAndUpdate(cache.id, update, callback);
	}
}

exports.updateFormatGenerating = function(cache, format, callback) {
	cache.formats = cache.formats || {};
	cache.formats[format] = {
		generating: true
	};
	cache.markModified('formats');
	cache.save(function(err) {
		exports.getCacheById(cache.id, callback);
	});
}
