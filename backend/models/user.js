const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { stringify } = require('querystring');

const userSchema = mongoose.Schema({
  _id: {type: String, required: true },
  name: {type: String, required: true },
  email: { type: String, required: true, unique: true, index: true }, // unique doesn't not throw error if not unique
  phoneNumber: { type: String, required: true},
  role: {type: String, default: ""},
  addresses: {type: [String], default: []},
  companyCode: {type: String, required: true},
  customerCode: {type: String, required: true}
}, { timestamps: true, autoCreate: true });

userSchema.plugin(uniqueValidator); // Throw error if not unique

module.exports = mongoose.model('User', userSchema);
