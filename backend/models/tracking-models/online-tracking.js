const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const fuzzySearch = require('mongoose-fuzzy-searching');

const GeneralInfoSchema = require('./general-info').schema;
const ListItemSchema = require('./list-item').schema;

const onlineTrackingSchema = mongoose.Schema({
  trackingNumber: {type: String, required: true, unique: true},
  carrierTracking: {type: mongoose.Types.ObjectId, ref: "CarrierTracking"},
  generalInfo: GeneralInfoSchema,
  itemsList: [ListItemSchema]
}, {timestamps: true, autoCreate: true });

onlineTrackingSchema.plugin(uniqueValidator); // Throw error if not unique
onlineTrackingSchema.plugin(fuzzySearch, { fields: ['trackingNumber', 'generalInfo.status', 'carrier', 'generalInfo.content'] });
module.exports = mongoose.model('OnlineTracking', onlineTrackingSchema);
