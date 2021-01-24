const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const carrierTracking = mongoose.Schema({
  carrierTrackingNumber: {type: String, required: true, index: true, unique: true}, //USPS tracking numbers can be recycled, let's hope it's not often
  status: {type: String, required: true},
  trackerId: {type: String, required: true, unique: true}, // Tracker Object id, optional // Use for easy post to update status
  carrier: {type: String, required: true},
  trackingNumber: {type: String, required: true, unique: true}  // sev-123213 mst-123452 // this is supposed to be general
}, {timestamps: true, autoCreate: true });

carrierTracking.plugin(uniqueValidator); // Throw error if not unique
module.exports = mongoose.model('carrier-tracking', carrierTracking);
