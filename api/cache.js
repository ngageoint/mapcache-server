var CacheModel = require('../models/cache');

function Cache() {
}

Cache.prototype.getAll = function(options, callback) {

  CacheModel.getCaches(callback);

  //
  // var event = this._event;
  // var filter = options.filter;
  // if (filter && filter.geometries) {
  //   allObservations = [];
  //   async.each(
  //     filter.geometries,
  //     function(geometry, done) {
  //       options.filter.geometry = geometry;
  //       ObservationModel.getObservations(event, options, function (err, observations) {
  //         if (err) return done(err);
  //
  //         if (observations) {
  //           allObservations = allObservations.concat(observations);
  //         }
  //
  //         done();
  //       });
  //     },
  //     function(err) {
  //       callback(err, allObservations);
  //     }
  //   );
  // } else {
  //   ObservationModel.getObservations(event, options, callback);
  // }
}

// Cache.prototype.getById = function(observationId, options, callback) {
//   if (typeof options == 'function') {
//     callback = options;
//     options = {};
//   }
//
//   ObservationModel.getObservationById(this._event, observationId, options, callback);
// }

Cache.prototype.create = function(cache, callback) {
  CacheModel.createCache(cache, callback);
}

// Observation.prototype.update = function(observationId, observation, callback) {
//   ObservationModel.updateObservation(this._event, observationId, observation, callback);
// }
//
// Observation.prototype.addState = function(observationId, state, callback) {
//   ObservationModel.addState(this._event, observationId, state, callback);
// }
//
// Observation.prototype.delete = function(observationId, callback) {
//   ObservationModel.removeFeature(this._event, observationId, function(err, observation) {
//     if (observation) {
//       observation.attachments.forEach(function(attachment) {
//         var file = path.join(attachmentBase, attachment.relativePath);
//         fs.remove(file, function(err) {
//           if (err) {
//             console.error("Could not remove attachment file " + file + ". ", err);
//           }
//         });
//       });
//     }
//
//     callback(err, observation);
//   });
// }

module.exports = Cache;
