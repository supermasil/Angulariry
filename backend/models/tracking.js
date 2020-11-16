const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const fuzzySearch = require('mongoose-fuzzy-searching');

const timelineSchema = mongoose.Schema({
  user: {type: String, ref: 'User', index: true, required: true},
  action: {type: String, required: true},
  timestamp: {type: Date, default: Date.now()}
}, { _id: false });

const trackingSchema = mongoose.Schema({
  //USPS tracking numbers can be recycled, let's hope it's not often
  trackingNumber: {type: String, required: true, unique: true, index: true},
  status: {type: String, require: true},
  carrier: {type: String, require: true},
  imagePath: {type: String},
  creator: {type: String, ref: 'User', required: true},
  trackerId: {type: String, required: true}, // Tracker Object id, optional
  content: {type: String},
  active: {type: Boolean, required: true},
  timeline: [timelineSchema]
}, {timestamps: true});

trackingSchema.plugin(uniqueValidator); // Throw error if not unique
trackingSchema.plugin(fuzzySearch, { fields: ['trackingNumber', 'status', 'carrier', 'content'] });
module.exports = mongoose.model('Tracking', trackingSchema);
