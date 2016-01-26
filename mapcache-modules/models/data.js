var mongoose = require('mongoose');

// Creates a new Mongoose Schema object
var Schema = mongoose.Schema;

var MapDataSchema = new Schema({
  url: { type: String, required: false },
  format: { type: String, required: true},
  projection: { type: String, required: false},
  vector: { type: Boolean, required: true, default: false},
  metadata: Schema.Types.Mixed,
  geometry: Schema.Types.Mixed,
  filePath: { type: String, required: false},
  zOrder: { type: Number, required: true, default: -1}
});

var MapData;
if (mongoose.models.MapData) {
  MapData = mongoose.model('MapData');
} else {
  MapData = mongoose.model('MapData', MapDataSchema);
}
exports.mapDataModel = MapData;
