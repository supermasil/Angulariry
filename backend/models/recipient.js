const mongoose = require('mongoose');
const AddressSchema = require('./address');

// This is only used at sub-document
const RecipientSchema = mongoose.Schema({
  name: { type: String },
  email: { type: String }, // Doesn't have to have email
  phoneNumber: { type: String, required: true},
  address: {type: AddressSchema, required: true}
}, { _id: false });

module.exports = RecipientSchema;
