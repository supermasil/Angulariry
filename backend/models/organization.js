const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const locationSchema = new Schema({
  phoneNumber: { type: String, required: true},
  fax: { type: String, default: ""},
  address: {type: String, required: true},
  operatingHours: {type: [String], required: true}, //hh:mm:ss - hh:mm:ss
  operatingDays: {type: [String], required: true} // Mon, Tues ....
}, {_id: false});

const organizationSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true}, // unique doesn't not throw error if not unique
  name: {type: String, required: true, unique: true},
  companyCode: {type: String, required: true, unique: true, index: true},
  locations: [locationSchema]
}, { timestamps: true, autoCreate: true });

organizationSchema.plugin(uniqueValidator); // Throw error if not unique
locationSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Organization', organizationSchema);
