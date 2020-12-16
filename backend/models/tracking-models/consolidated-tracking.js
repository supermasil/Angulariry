
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const fuzzySearch = require('mongoose-fuzzy-searching');

const GeneralInfoSchema = require('./general-info').schema;

const consolidatedTrackingSchema = mongoose.Schema({
  trackingNumber: {type: String, required: true, unique: true},
  onlineTrackings: [{type: mongoose.Types.ObjectId, ref: "OnlineTracking"}],
  servicedTrackings: [{type: mongoose.Types.ObjectId, ref: "OnlineTracking"}],
  consolidatedTrackings: [{type: mongoose.Types.ObjectId, ref: "OnlineTracking"}],
  generalInfo: GeneralInfoSchema,
}, {timestamps: true, autoCreate: true });

consolidatedTrackingSchema.plugin(uniqueValidator); // Throw error if not unique
consolidatedTrackingSchema.plugin(fuzzySearch, { fields: [] });

module.exports = mongoose.model('ConsolidatedTracking', consolidatedTrackingSchema);
