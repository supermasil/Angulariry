
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const GeneralInfoSchema = require('./general-info-schema');

const consolidatedTrackingSchema = mongoose.Schema({
  trackingNumber: {type: String, required: true, unique: true, index: true},
  onlineTrackings: [{type: mongoose.Types.ObjectId, ref: "online-tracking"}],
  servicedTrackings: [{type: mongoose.Types.ObjectId, ref: "serviced-tracking"}],
  inPersonTrackings: [{type: mongoose.Types.ObjectId, ref: "in-person-tracking"}],
  generalInfo: {type: GeneralInfoSchema, required: true}
}, {timestamps: true, autoCreate: true });

consolidatedTrackingSchema.plugin(uniqueValidator); // Throw error if not unique

module.exports = mongoose.model('consolidated-tracking', consolidatedTrackingSchema);
