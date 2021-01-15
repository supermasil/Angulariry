const mongoose = require('mongoose')

// This is only used at sub-document
const AddressSchema = mongoose.Schema({
  address: {type: String, required: true },
  addressLineTwo: {type: String},
  addressUrl: {type: String},
});

module.exports = AddressSchema;
