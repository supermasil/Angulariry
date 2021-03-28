const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const AddressSchema = require('./address');
const RecipientSchema = require('./recipient');

const userSchema = mongoose.Schema({
  id: {type: String, required: true, index: true}, // Firebase id
  name: {type: String, required: true },
  email: { type: String, required: true, unique: true, index: true }, // unique doesn't not throw error if not unique
  phoneNumber: { type: String, required: true},
  addresses: [AddressSchema],
  recipients: [RecipientSchema],
  pricings: {type: mongoose.Types.ObjectId, ref: "pricing", default: null},
  userCode: {type: String, required: true, index: true}, // Can have duplicates across org
  organization: {type: mongoose.Types.ObjectId, ref: "organization", default: null},
  organizations: [{
    organization: {type: mongoose.Types.ObjectId, ref: "organization"},
    role: {type: String, default: 'Customer'},
    creatorId: {type: mongoose.Types.ObjectId, ref: "user"},
    credit: {type: Number, required: true, default: 0},
    active: {type: Boolean, required: true, default: true},
    creditHistory: [{type: mongoose.Types.ObjectId, ref: "history"}]
  }],
  role: {type: String, default: 'Customer'},
  creatorId: {type: mongoose.Types.ObjectId, ref: "user"},
  active: {type: Boolean, required: true, default: true},
  credit: {type: Number, required: true, default: 0},
  creditHistory: [{type: mongoose.Types.ObjectId, ref: "history"}]
}, { timestamps: true, autoCreate: true});

userSchema.plugin(uniqueValidator); // Throw error if not unique

module.exports = mongoose.model('user', userSchema);
