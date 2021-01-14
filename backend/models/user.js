const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const AddressSchema = require('./address');
const RecipientSchema = require('./recipient');

const userSchema = mongoose.Schema({
  _id: {type: String, required: true },
  name: {type: String, required: true },
  email: { type: String, required: true, unique: true, index: true }, // unique doesn't not throw error if not unique
  phoneNumber: { type: String, required: true},
  role: {type: String, required: true},
  defaultLocation: {type: String, required: true}, // Oregon, California...
  addresses: [AddressSchema],
  recipients: [RecipientSchema],
  companyCode: {type: String, required: true},
  customerCode: {type: String, required: true, unique: true, index: true},
  organization: {type: mongoose.Types.ObjectId, ref: "organization", index: true},
  pricings: {type: mongoose.Types.ObjectId, ref: "pricing"},
  active: {type: Boolean, required: true, default: true},
  credit: {type: Number, required: true, default: 0}
}, { timestamps: true, autoCreate: true });

userSchema.plugin(uniqueValidator); // Throw error if not unique

module.exports = mongoose.model('user', userSchema);
