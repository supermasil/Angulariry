
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const fuzzySearch = require('mongoose-fuzzy-searching');

const GeneralInfoSchema = require('./general-info-schema');

const consolidatedTrackingSchema = mongoose.Schema({
  trackingNumber: {type: String, required: true, unique: true},
  onlineTrackings: [{type: mongoose.Types.ObjectId, ref: "online-tracking"}],
  servicedTrackings: [{type: mongoose.Types.ObjectId, ref: "serviced-tracking"}],
  inPersonTrackings: [{type: mongoose.Types.ObjectId, ref: "in-person-tracking"}],
  generalInfo: GeneralInfoSchema,
}, {timestamps: true, autoCreate: true });

consolidatedTrackingSchema.plugin(uniqueValidator); // Throw error if not unique
consolidatedTrackingSchema.plugin(fuzzySearch, { fields: [] });

module.exports = mongoose.model('consolidated-tracking', consolidatedTrackingSchema);
