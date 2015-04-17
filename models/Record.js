var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId;

// v2 schema
var RecordSchema = new Schema({
  appName: { type: String, required: true, default: '' },
  url: { type: String, required: true, default: '' },
  data: { type: Object, required: true, default: {} },
  created_at: { type: Date, required: true, default: Date.now }
},
  {
    // make this a capped collection. It will overwrite old records as new records start to break cap limit
    capped: { size: 450000000 }
  });

module.exports = mongoose.model('Record', RecordSchema);
