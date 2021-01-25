const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const fuzzySearch = require('mongoose-fuzzy-searching');

const GeneralInfoSchema = require('./general-info-schema');
const ListItemSchema = require('./list-item-schema');
const RecipientSchema = require('../recipient');

const inPersonTrackingSchema = mongoose.Schema({
  trackingNumber: {type: String, required: true, unique: true},
  generalInfo: {type: GeneralInfoSchema, required: true},
  itemsList: {type: [ListItemSchema], required: true},
  linkedTo: [{type: mongoose.Types.ObjectId, ref: "consolidated-tracking"}]
}, {timestamps: true, autoCreate: true });

inPersonTrackingSchema.plugin(uniqueValidator); // Throw error if not unique
inPersonTrackingSchema.plugin(fuzzySearch, { fields: [] });
module.exports = mongoose.model('in-person-tracking', inPersonTrackingSchema);
