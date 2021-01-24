const mongoose = require('mongoose');
const AddressSchema = require('./address');
const uniqueValidator = require('mongoose-unique-validator');

// This is only used as sub-document
const recipientSchema = mongoose.Schema({
  name: { type: String, required: true},
  email: { type: String }, // Doesn't have to have email
  phoneNumber: { type: String, required: true},
  address: {type: AddressSchema, required: true}
}, {_id: false});

recipientSchema.plugin(uniqueValidator); // Throw error if not unique

module.exports = recipientSchema;
