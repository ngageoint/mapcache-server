var log = require('mapcache-log')
  , FeatureModel = require('mapcache-models').Feature
  , async = require('async');

exports.isAlreadyProcessed = function(source, callback) {
  log.debug('Checking if the source %s is already processed', source.id);
  if (source.status && source.status.complete) {
    return callback(true);
  }
  FeatureModel.getFeatureCount({sourceId: source.id, cacheId: null}, function(resultArray){
    log.debug("The source already has features", resultArray);
    if (resultArray[0].count !== '0') {
      return callback(true);
    } else {
      return callback(false);
    }
  });
};

function setSourceCount(source, callback) {
  if (source.status.totalFeatures) {
    return callback(null, source);
  }
  FeatureModel.getFeatureCount({sourceId: source.id, cacheId: null}, function(resultArray){
    source.status.totalFeatures = parseInt(resultArray[0].count);
    source.status.generatedFeatures = parseInt(resultArray[0].count);
    callback(null, source);
  });
}

function setSourceExtent(source, callback) {
  if (source.geometry) {
    return callback(null, source);
  }
  FeatureModel.getExtentOfSource({sourceId:source.id}, function(resultArray) {
    source.geometry = {
      type: "Feature",
      geometry: JSON.parse(resultArray[0].extent)
    };
    callback(null, source);
  });
}

function setSourceStyle(source, callback) {
  if (source.style && source.style.defaultStyle) {
    return callback(null, source);
  }
  source.style = source.style || { };
  if (!source.style.defaultStyle || !source.style.defaultStyle.style || !source.style.defaultStyle.style.fill) {
    source.style.defaultStyle = {
      style: {
        'fill': "#000000",
        'fill-opacity': 0.5,
        'stroke': "#0000FF",
        'stroke-opacity': 1.0,
        'stroke-width': 1
      }
    };
  }

  source.style.styles = source.style.styles || [];
  callback(null, source);
}

function setSourceProperties(source, callback) {
  if (source.properties) {
    return callback(null, source);
  }
  source.properties = [];
  FeatureModel.getPropertyKeysFromSource({sourceId: source.id}, function(propertyArray){
    async.eachSeries(propertyArray, function(key, propertyDone) {
      FeatureModel.getValuesForKeyFromSource(key.property, {sourceId: source.id}, function(valuesArray) {
        source.properties.push({key: key.property, values: valuesArray.map(function(current) {
          return current.value;
        })});
        propertyDone();
      });
    }, function() {
      callback(null, source);
    });
  });
}

exports.completeProcessing = function(source, callback) {
  async.waterfall([
    function(callback) {
      callback(null, source);
    },
    setSourceCount,
    setSourceExtent,
    setSourceStyle,
    setSourceProperties
  ], function (err, source){
    source.status.complete = true;
    source.status.message = "Complete";
    source.status.failure = false;
    callback(err, source);
  });
};
