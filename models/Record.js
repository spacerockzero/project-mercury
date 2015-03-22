var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId;

// v2 schema
var RecordSchema = new Schema({
  appName: { type: String, required: true, default: '' },
  data: { type: Object, required: true, default: {} },
  created_at: { type: Date, required: true, default: Date.now }
});

module.exports = mongoose.model('Record', RecordSchema);
