const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const fuzzySearch = require('mongoose-fuzzy-searching');

const GeneralInfoSchema = require('./general-info').schema;
const ListItemSchema = require('./list-item').schema;



const inPersonTrackingSchema = mongoose.Schema({
  trackingNumber: {type: String, required: true, unique: true},

  // sender: {type: String, required: true}, // It's customer code
  recipient: {type: String, required: true},

  generalInfo: GeneralInfoSchema,
  itemsList: [ListItemSchema],
}, {timestamps: true, autoCreate: true });

inPersonTrackingSchema.plugin(uniqueValidator); // Throw error if not unique
inPersonTrackingSchema.plugin(fuzzySearch, { fields: [] });
module.exports = mongoose.model('InPersonTracking', inPersonTrackingSchema);
