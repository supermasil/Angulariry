const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const AddressSchema = require('./address');

const locationSchema = mongoose.Schema({
  name: {type: String, required: true},
  phoneNumber: { type: String, required: true},
  faxNumber: { type: String, default: ""},
  address: AddressSchema,
  operatingHours: {type: [String], required: true}, //hh:mm:ss - hh:mm:ss
  operatingDays: {type: [String], required: true} // Mon, Tues ....
}, {_id: false});

const organizationSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true}, // unique doesn't not throw error if not unique
  name: {type: String, required: true, unique: true},
  companyCode: {type: String, required: true, unique: true, index: true},
  locations: [locationSchema],
  insuranceOptions: [String],
  pricings: {type: mongoose.Types.ObjectId, ref: "pricing"}, // Not required from the beginning
  active: {type: Boolean, required: true, default: true}
}, { timestamps: true, autoCreate: true });

organizationSchema.plugin(uniqueValidator); // Throw error if not unique
locationSchema.plugin(uniqueValidator);

module.exports = mongoose.model('organization', organizationSchema);
