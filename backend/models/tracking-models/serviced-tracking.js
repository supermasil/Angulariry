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
  carrierTrackings: [{type: mongoose.Types.ObjectId, ref: "carrier-tracking"}]
}, {_id: false});

const servicedTrackingSchema = mongoose.Schema({
  trackingNumber: {type: String, required: true, unique: true},
  requestedItems: [requestedItem],
  generalInfo: GeneralInfoSchema,
  itemsList: [ListItemSchema]
}, {timestamps: true, autoCreate: true });

servicedTrackingSchema.plugin(uniqueValidator); // Throw error if not unique
servicedTrackingSchema.plugin(fuzzySearch, { fields: [] });

module.exports = mongoose.model('serviced-tracking', servicedTrackingSchema);
