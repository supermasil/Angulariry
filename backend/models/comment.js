const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const commentSchema = mongoose.Schema({
  creatorId: { type: String, required: true }, // google Id, has to be string
  trackingId: { type: mongoose.Types.ObjectId, ref: "Tracking", required: true },
  name: { type: String, required: true },
  imagePaths: [{ type: String }],
  content: { type: String },
  attachmentPaths: [{ type: String }]
}, { timestamps: true });

commentSchema.plugin(uniqueValidator); // Throw error if not unique

module.exports = mongoose.model('Comment', commentSchema);
