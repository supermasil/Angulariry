const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const addressSchema = mongoose.Schema({
  address: {type: String, required: true },
  addressLineTwo: {type: String, default: ""},
  addressUrl: {type: String, default: ""},
}, {autoCreate: true})

const recipientSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, index: true, default: ""}, // Doesn't have to have email
  phoneNumber: { type: String, required: true},
  addresses: {type: [String], required: true, default: []}
}, {autoCreate: true });

const userSchema = mongoose.Schema({
  _id: {type: String, required: true },
  name: {type: String, required: true },
  email: { type: String, required: true, unique: true, index: true }, // unique doesn't not throw error if not unique
  phoneNumber: { type: String, required: true},
  role: {type: String, required: true},
  addresses: {type: [addressSchema], default: []},
  companyCode: {type: String, required: true},
  customerCode: {type: String, required: true, unique: true, index: true},
  recipients: {type: [recipientSchema], default: []}
}, { timestamps: true, autoCreate: true });

userSchema.plugin(uniqueValidator); // Throw error if not unique
recipientSchema.plugin(uniqueValidator);
addressSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
