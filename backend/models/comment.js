const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const commentSchema = mongoose.Schema({
  trackingId: { type: String, required: true },
  creatorId: { type: String, required: true }, // google Id, has to be string
  creatorName: { type: String, required: true },
  filePaths: [{ type: String }],
  content: { type: String }
}, { timestamps: true, autoCreate: true }); // AutoCreate is needed to create with session

commentSchema.plugin(uniqueValidator); // Throw error if not unique
module.exports = mongoose.model('comment', commentSchema);
