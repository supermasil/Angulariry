const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

// This is only used at sub-document
const historySchema = mongoose.Schema({
  userId: {type: String, required: true},
  action: {type: String, required: true},
  postId: {type: String, required: true}  // sev-123213 mst123452
}, { timestamps: true, autoCreate: true });


historySchema.plugin(uniqueValidator); // Throw error if not unique
module.exports = mongoose.model('history', historySchema);
