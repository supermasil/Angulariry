const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const fuzzySearch = require('mongoose-fuzzy-searching');

const GeneralInfoSchema = require('./general-info-schema');
const ListItemSchema = require('./list-item-schema');

const onlineTrackingSchema = mongoose.Schema({
  trackingNumber: {type: String, required: true, unique: true},
  carrierTracking: {type: mongoose.Types.ObjectId, ref: "carrier-tracking", index: true},
  generalInfo: {type: GeneralInfoSchema, required: true},
  itemsList: {type: [ListItemSchema], required: true},
}, {timestamps: true, autoCreate: true });

onlineTrackingSchema.plugin(uniqueValidator); // Throw error if not unique
onlineTrackingSchema.plugin(fuzzySearch, { fields: [] });
module.exports = mongoose.model('online-tracking', onlineTrackingSchema);
