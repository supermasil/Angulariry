const mongoose = require('mongoose');

const GeneralInfoSchema = require('./general-info-schema');
const ListItemSchema = require('./list-item-schema');

const inPersonSubTrackingSchema = mongoose.Schema({
  trackingNumber: {type: String, required: true, unique: true, index: true},
  itemsList: {type: [ListItemSchema], required: true},
  linkedToCsl: {type: mongoose.Types.ObjectId, ref: "consolidated-tracking"},
  linkedToMst: {type: mongoose.Types.ObjectId, ref: "master-tracking"},
  generalInfo: {
    totalWeight: {type: Number, default: 0},
    finalCost: {type: Number, default: 0},
    costAdjustment: {type: Number, default: 0},
    exchange: {type: Number, default: 0},
    paid: {type: Boolean, default: false},
    status: {type: String, required: true, default: "Unknown"}
  }
})

const inPersonTrackingSchema = mongoose.Schema({
  trackingNumber: {type: String, required: true, unique: true, index: true},
  generalInfo: {type: GeneralInfoSchema, required: true},
  subTrackings: [inPersonSubTrackingSchema]
}, {timestamps: true, autoCreate: true });

module.exports = mongoose.model('in-person-tracking', inPersonTrackingSchema);
