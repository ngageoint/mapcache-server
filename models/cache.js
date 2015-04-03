var mongoose = require('mongoose');

// Creates a new Mongoose Schema object
var Schema = mongoose.Schema;

// Creates the Schema for the cache objects
var CacheSchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: false },
  date: {type: Date, require: true },
	geometry: Schema.Types.Mixed,
	maxZoom: {type: Number, required: true },
	minZoom: {type: Number, required: true},
	sourceId: { type: Schema.Types.ObjectId, ref: 'Source', required: true }
});

CacheSchema.index({geometry: "2dsphere"});
CacheSchema.index({'name': 1});

function transform(cache, ret, options) {
	ret.id = ret._id;
	delete ret._id;

	if (cache.populated('sourceId')) {
		ret.source = ret.sourceId;
		delete ret.sourceId;
	}

	var path = options.path ? options.path : "";
  ret.url = [path, cache.id].join("/");
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
    callback(err, cache);
  });
}

exports.createCache = function(cache, callback) {
	if (cache.sourceId) {
		Cache.create(cache, function(err, newCache) {
			newCache.source = newSource;
			callback(err, newCache);
		});
		return;
	}
	getSourceByUrlAndFormat(cache.source.url, cache.source.format, function(err, source) {
		if (source) {
			cache.sourceId = newSource._id;
			Cache.create(cache, function(err, newCache) {
				newCache.source = newSource;
				callback(err, newCache);
			});
		} else {
			Source.create(cache.source, function(err, newSource) {
				if (err) return callback(err);
				cache.sourceId = newSource._id;
				Cache.create(cache, function(err, newCache) {
					newCache.source = newSource;
					callback(err, newCache);
				});
			});
		}
	});
}
