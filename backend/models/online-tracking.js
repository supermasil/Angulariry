const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const fuzzySearch = require('mongoose-fuzzy-searching');

const historySchema = require('./history').schema;

const trackingSchema = mongoose.Schema({
  //USPS tracking numbers can be recycled, let's hope it's not often
  trackingNumber: {type: String, required: true, index: true},
  status: {type: String, require: true},
  carrier: {type: String, require: true},
  filePaths: [{type: String}],
  creatorId: {type: String, required: true}, // Google id, has to be string
  trackerId: {type: String}, // Tracker Object id, optional
  content: {type: String},
  active: {type: Boolean, required: true}, // This should be false to prevent edit after certain stage
  timeline: [historySchema],
  comments: [{type: mongoose.Types.ObjectId, ref: "Comment"}],
  type: {type: String, required: true} // Online Order...
}, {timestamps: true, autoCreate: true });

trackingSchema.plugin(uniqueValidator); // Throw error if not unique
trackingSchema.plugin(fuzzySearch, { fields: ['trackingNumber', 'status', 'carrier', 'content'] });
module.exports = mongoose.model('Tracking', trackingSchema);
