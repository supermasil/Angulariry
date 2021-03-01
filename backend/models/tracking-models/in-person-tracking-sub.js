const mongoose = require('mongoose');

const GeneralInfoSchema = require('./general-info-schema');
const ListItemSchema = require('./list-item-schema');

const inPersonSubTrackingSchema = mongoose.Schema({
  trackingNumber: {type: String, required: true, unique: true, index: true},
  generalInfo: {type: GeneralInfoSchema, required: true},
  itemsList: {type: [ListItemSchema], required: true},
  linkedToCsl: {type: mongoose.Types.ObjectId, ref: "consolidated-tracking"},
  linkedToMst: {type: mongoose.Types.ObjectId, ref: "master-tracking"}
}, {timestamps: true, autoCreate: true });

module.exports = mongoose.model('in-person-tracking-sub', inPersonSubTrackingSchema);
