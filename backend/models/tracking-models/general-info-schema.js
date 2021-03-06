const mongoose = require('mongoose');
const RecipientSchema = require('../recipient');

const shippingOptionsSchema = mongoose.Schema({
  payAtDestination: {type: Boolean, default: false},
  receiveAtDestination: {type: Boolean, default: false},
}, {_id: false});

// This is only used at sub-document
const GeneralInfoSchema = mongoose.Schema({
  sender: {type: mongoose.Types.ObjectId, ref: 'user', index: true}, // user _id
  recipient: RecipientSchema,
  organization: {type: mongoose.Types.ObjectId, ref: "organization", required: true},
  content: {type: String, default: ''}, // Note
  trackingStatus: {type: String, required: true, default: "Unknown"},
  financialStatus: {type: String, required: true, default: "Unknown"},
  active: {type: Boolean, required: true}, // This should be false to prevent edit after certain stage
  type: {type: String, required: true},

  totalWeight: {type: Number, default: 0}, // Can be updated later on
  finalCost: {type: Number, default: 0}, // The money to charge customer
  costAdjustment: {type: Number, default: 0},
  exchange: {type: Number, default: 0},

  currentLocation: {type: String, required: true}, //Unknown, Oregon, HN, SG....
  origin: {type: String, required: true},
  destination: {type: String, required: true},
  shippingOptions: shippingOptionsSchema,

  creatorId: {type: mongoose.Types.ObjectId, ref: "user", required: true},

  filePaths: [{type: String}],
  comments: [{type: mongoose.Types.ObjectId, ref: "comment"}]
}, { _id: false });

module.exports = GeneralInfoSchema;
