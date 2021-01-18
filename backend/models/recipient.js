const mongoose = require('mongoose');
const AddressSchema = require('./address');
const uniqueValidator = require('mongoose-unique-validator');

// This is only used at sub-document
const recipientSchema = mongoose.Schema({
  name: { type: String, unique: true},
  email: { type: String }, // Doesn't have to have email
  phoneNumber: { type: String, required: true},
  address: {type: AddressSchema, required: true}
});

recipientSchema.plugin(uniqueValidator); // Throw error if not unique

module.exports = recipientSchema;
