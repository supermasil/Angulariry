const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const carrierTracking = mongoose.Schema({
  trackingNumber: {type: String, required: true, index: true}, //USPS tracking numbers can be recycled, let's hope it's not often
  status: {type: String, required: true, default: "Unknown"},
  trackerId: {type: String, required: true}, // Tracker Object id, optional // Use for easy post to update status
  carrier: {type: String, required: true},
}, {timestamps: true, autoCreate: true });

carrierTracking.plugin(uniqueValidator); // Throw error if not unique
module.exports = mongoose.model('CarrierTracking', carrierTracking);
