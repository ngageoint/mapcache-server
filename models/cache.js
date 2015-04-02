var mongoose = require('mongoose');

// Creates a new Mongoose Schema object
var Schema = mongoose.Schema;

var SourceSchema = new Schema({
	name: { type: String, required: false },
	url: { type: String, required: false },
	format: { type: String, required: true}
});

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

var transform = function(cache, ret, options) {
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

var Source = mongoose.model('Source', SourceSchema);
var Cache = mongoose.model('Cache', CacheSchema);
exports.sourceModel = Source;
exports.cacheModel = Cache;

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

	Source.create(cache.source, function(err, newSource) {
		if (err) return callback(err);
		cache.sourceId = newSource._id;
		Cache.create(cache, function(err, newCache) {
			newCache.source = newSource;
			callback(err, newCache);
		});
	});

}
