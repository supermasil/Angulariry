const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

// This is only used at sub-document
const historySchema = mongoose.Schema({
  userId: {type: String, required: true},
  action: {type: String, required: true},
  timestamp: {type: Date, default: Date.now()}
}, { _id: false });


historySchema.plugin(uniqueValidator); // Throw error if not unique
module.exports = mongoose.model('History', historySchema);
