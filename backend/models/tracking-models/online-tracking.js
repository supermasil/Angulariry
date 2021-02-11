const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const fuzzySearch = require('mongoose-fuzzy-searching');

const GeneralInfoSchema = require('./general-info-schema');
const ListItemSchema = require('./list-item-schema');

const onlineTrackingSchema = mongoose.Schema({
  trackingNumber: {type: String, required: true, unique: true, index: true},
  carrierTracking: {type: mongoose.Types.ObjectId, ref: "carrier-tracking"},
  generalInfo: {type: GeneralInfoSchema, required: true},
  itemsList: {type: [ListItemSchema], required: true},
  received: {type: Boolean, required: true},
  linkedToCsl: {type: mongoose.Types.ObjectId, ref: "consolidated-tracking"},
  linkedToMst: {type: mongoose.Types.ObjectId, ref: "master-tracking"}
}, {timestamps: true, autoCreate: true });

onlineTrackingSchema.plugin(uniqueValidator); // Throw error if not unique
module.exports = mongoose.model('online-tracking', onlineTrackingSchema);
