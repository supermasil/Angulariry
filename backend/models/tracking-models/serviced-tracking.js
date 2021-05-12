const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const fuzzySearch = require('mongoose-fuzzy-searching');

const GeneralInfoSchema = require('./general-info-schema');
const ListItemSchema = require('./list-item-schema');

requestedItem = mongoose.Schema({
  link: {type: String, required: true},
  declaredValue: {type: Number, required: true},
  specifications: {type: String, required: true},
  quantity: {type: Number, required: true},
  orderNumbers: [{type: String}], // A link can have multiple order numbers
  carrierTrackings: {type: mongoose.Types.ObjectId, ref: "carrier-tracking"}
}, {_id: false});

const servicedTrackingSchema = mongoose.Schema({
  trackingNumber: {type: String, required: true, unique: true, index: true},
  requestedItems: [requestedItem],
  generalInfo: {type: GeneralInfoSchema, required: true},
  itemsList: {type: [ListItemSchema], required: true},
  linkedToCsl: {type: mongoose.Types.ObjectId, ref: "consolidated-tracking"},
  linkedToMst: {type: mongoose.Types.ObjectId, ref: "master-tracking"}
}, {timestamps: true, autoCreate: true });

servicedTrackingSchema.plugin(uniqueValidator); // Throw error if not unique

module.exports = mongoose.model('serviced-tracking', servicedTrackingSchema);
