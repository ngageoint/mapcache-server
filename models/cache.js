var mongoose = require('mongoose');
// //var node2geoserver = require('../plugins/node2geoserver');
// var tileDownloaderManager = require('../downloader/TileDownloadManager');
// var childProcessor = require('../downloader/childProcessor');
// var config = require('../config.json');
// var getDiskSize = require('size-on-disk');
// var getCacheSize = require('get-folder-size');
// var fs = require('fs-extra');
// var Log = require('log');
// var mv = require('mv');

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
	cache.source.format = 'XYZ';
	Source.create(cache.source, function(err, newSource) {
		if (err) return callback(err);
		cache.sourceId = newSource._id;
		Cache.create(cache, function(err, newCache) {
			callback(err, newCache);
		});
	});


	    // Cache.create(newCache, function(err, newCache) {
	    //   if (err) {
	    //     console.log("Problem creating cache: " + err);
	    //   } else {
	    //      // createCacheCollection(newCache);
	    //      // node2geoserver.putGeoserver(name, bbox, maxZoom);
			//
	    //       var bbox = {
	    //     			  "NE":{
			// 	       		  "lat":newCache.bounds._northEast.lat,
			// 	       		  "long":newCache.bounds._northEast.lng},
	    //     			  "SW":{
			// 	       		  "lat":newCache.bounds._southWest.lat,
			// 	       		  "long":newCache.bounds._southWest.lng}
	    //       }
	    //      // console.log('bbox' + JSON.stringify(bbox));
			//
	    //  	 Cache.findById(newCache.id).populate('source').exec(function(err, newCache) {
	    //  	    if (err) {
	    //  	      console.log("Error finding cache in mongo: " + id + ', error: ' + err);
	    //  	    }
	    //  	   childProcessor.spawnChild(newCache.id, newCache.name, newCache.maxZoom, newCache.source.url, newCache.source.type, bbox);
	    //  	   callback(err, newCache);
			//
	    //  	  });
	    //   }
	    // });
}

// exports.redownloadCache = function(id, callback) {
// 	 Cache.findOne({_id: id}, function(err, cache) {
// 	    if (err) {
// 	      console.log("Could not re-download cache: " + id + ', error: ' + err);
// 	    }else{
// 	          var bbox = {
// 	        			  "NE":{
// 				       		  "lat":cache.bounds._northEast.lat,
// 				       		  "long":cache.bounds._northEast.lng},
// 	        			  "SW":{
// 				       		  "lat":cache.bounds._southWest.lat,
// 				       		  "long":cache.bounds._southWest.lng}
// 	        	  }
// 	    	childProcessor.spawnChild(cache.name, cache.maxZoom, cache.serverUrl, cache.type, bbox);
// 	    }
// 	    callback(err, cache);
// 	  });
// 	}
//
// exports.updateCache = function(id, newCache, callback) {
//
//  Cache.findOne({_id: id}, function(err, cache) {
// 	    if (err) {
// 	      console.log("Could not find : " + id + ', error: ' + err);
// 	    }
//
// 	    if (newCache.name !== cache.name){
// 	    	 console.log(configserver.cacheDirectory.path+ cache.name+ ' renamed to ' +  configserver.cacheDirectory.path+ newCache.name);
// 	    	 mv(configserver.cacheDirectory.path+ cache.name, configserver.cacheDirectory.path+ newCache.name, {mkdirp: true}, function(err) {
// 	    		 console.log(err);
// 	    		});
// 	    	 }
// 	  });
//
//  Cache.update({_id:id}, newCache, function(err, cache) {
// 	    if (err) {
// 	      console.log('Could not update cache: ' + id + ' error: ' + err);
// 	    }
// 	  });
//
//  Cache.findOne({_id: id}, function(err, cache) {
// 	    if (err) {
// 	      console.log("Could not find cache: " + id + ', error: ' + err);
// 	    }
// 	    callback(err, cache);
// 	  });
//
//
// }

// exports.deleteCache= function(id, callback) {
//   Cache.findOne({_id: id}, function(err, cache) {
// 	    if (err) {
// 	      console.log("Error deleting tile folder for " + cache.name + ', error: ' + err);
// 	    }
// 	    console.log(cache.name);
// 	    fs.remove(configserver.cacheDirectory.path+ cache.name, function(err) {
// 	    	  if (err) return console.error(err)
// 	    	})
// 	  });
//   Cache.remove({_id:id}, function(err, deletedCache) {
// 	  if (err) {
// 		  	console.log('Could not delete cache: ' + id + ' error: ' + err);
// 	    }
// 	    callback(err, deletedCache);
//   });
// }
//
// exports.deleteAll= function(callback) {
// 	fs.removeSync(configserver.cacheDirectory.path, function(err) {
//    	  if (err) return console.error(err)
//    	})
//    	fs.mkdirsSync(configserver.cacheDirectory.path);
// 	   dropCacheCollection(function(err, status){
// 	    	 if (err) {
// 				  	console.log('Could not delete all caches, error: ' + err);
// 	    	 }
// 	    	 callback(err, status);
// 	    });
// 	}
//
// exports.updateseedStatus = function(name, seedUpdate, callback) {
// 	  Cache.update({name:name}, seedUpdate, function(err, status){
// 		  if (err) {
// 			  	console.log('Could not update seed status for cache: ' + name + ' error: ' + err);
// 		  }
// 		  callback(err);
// 	  });
// 	}
//
// exports.getseedStatus = function(id, callback) {
// 	 Cache.find({_id: id}, {name:1, seedStatus:1, tilesRequested:1, tilesDownloaded:1, totalTiles:1}, function(err, cache) {
// 	    if (err) {
// 	      console.log("Error finding cache in mongo: " + id + ', error: ' + err);
// 	    }
// 	    callback(err,cache);
// 	  });
// 	}
//
// exports.getallseedStatus = function(status, callback) {
// 	if (status){
// 	 Cache.find({seedStatus: status}, {name:1, seedStatus:1, tilesRequested:1, tilesDownloaded:1, totalTiles:1}, function(err, cache) {
// 		    if (err) {
// 		      console.log("Error finding cache in mongo. Error: " + err);
// 		    }
// 		    callback(err,cache);
// 		  });
// 	}
//
// 	else {
// 		 Cache.find({}, {name:1, seedStatus:1, tilesRequested:1, tilesDownloaded:1, totalTiles:1}, function(err, cache) {
// 			    if (err) {
// 			      console.log("Error finding cache in mongo. Error: " + err);
// 			    }
// 			    callback(err,cache);
// 			  });
// 		}
//
// 	}


// exports.DiskSize = function(name) {
//
// for (var k = 0; k < 19; k++){
//
// 		(function(){
// 			var i = k;
//
// 			fs.exists(configserver.cacheDirectory.path + name+'/' + i, function(exists){
// 	    		if (exists){
// 	    			(function(){
// 	    				var j = i;
// 	    				//console.log(configserver.cacheDirectory.path+name+'/' + i);
//
// 	    		    	getDiskSize(configserver.cacheDirectory.path+name+'/' + i, function(err, zoomSize){
//
// 	    		    		console.log('zoom level= ' + j);
// 	    		    				if (err){
// 	    		    					console.log("Error could not determine cache on disk size: " + name + " Error: "+ err);
// 	    		    				}
//
// 	    		    				var size= {$set: {}};
// 	    		    				size['sizeOnDisk.'+j]= zoomSize;
//
// 	    		    				Cache.update({name:name}, size, function(err, status){
// 	    		    				  if (err) {
// 	    		    					  	console.log('Could not update cache size on disk: ' + name + ' error: ' + err);
// 	    		    					  }
// 	    		    				  });
//
// 	    		    			});
// 	    			}());
//
// 	    		}
// 	    		else{
// 	    			//console.log('Zoom Level Doest not exist' + i );
// 	    		}
// 	    });
//
// 	}());
// 	}
// }
//
// exports.CacheSize = function(name) {
//
// 	for (var k = 0; k < 19; k++){
//
// 		(function(){
// 			var i = k;
//
// 			fs.exists(configserver.cacheDirectory.path + name+'/' + i, function(exists){
// 	    		if (exists){
// 	    			(function(){
// 	    				var j = i;
// 	    				//console.log(configserver.cacheDirectory.path+name+'/' + i);
//
// 	    		    	getCacheSize(configserver.cacheDirectory.path+name+'/' + i, function(err, zoomSize){
//
// 	    		    		console.log('zoom level= ' + j);
// 	    		    				if (err){
// 	    		    					console.log("Error could not determine cache size: " + name + " Error: "+ err);
// 	    		    				}
//
// 	    		    				var size= {$set: {}};
// 	    		    				size['cacheSize.'+j]= zoomSize;
//
// 	    		    				Cache.update({name:name}, size, function(err, status){
// 	    		    				  if (err) {
// 	    		    					  	console.log('Could not update cache size: ' + name + ' error: ' + err);
// 	    		    					  }
// 	    		    				  });
//
// 	    		    			});
// 	    			}());
//
// 	    		}
// 	    		else{
// 	    			//console.log('Zoom Level Doest not exist' + i );
// 	    		}
// 	    });
//
// 	}());
// 	}
// }
//
// exports.getSize = function(id, callback) {
// 	 Cache.find({_id: id}, {name:1, cacheSize:1, sizeOnDisk:1, totalTiles:1}, function(err, cache) {
// 	    if (err) {
// 	      console.log("Error finding cache in mongo. Error: " + err);
// 	    }
// 	    callback(err,cache);
// 	  });
// 	}
//
// exports.errorLog = function(cacheName) {
// 	var stream = fs.createReadStream('master_error_log')
// 	var log = new Log('error', stream);
// 	log.on('line', function(line){
// 		  str = line.msg
// 		  var errmsg = str.split(",");
// 		 if (errmsg[1] = ' name: ' +cacheName){
// 			 var wstream = fs.createWriteStream(configserver.cacheDirectory.path + cacheName+ '/cache_error_log', {flags:'a'});
// 			 var cachelog = new Log('error', wstream);
// 			 cachelog.error(errmsg[0]+ ',' + errmsg[1] + ','+ errmsg[2]+ ','+errmsg[3] );
// 			 }
// 		});
// 	}
