const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const shippingOptionsSchema = mongoose.Schema({
  payAtDestination: {type: Boolean, required: true, default: false},
  receiveAtDestination: {type: Boolean, required: true, default: false},
}, {_id: false});

// This is only used at sub-document
const generalInfo = mongoose.Schema({
  customerCode: {type: String, required: true, unique: true}, // Unique index
  organizationId: {type: String, required: true, unique: true},
  weight: {type: Number}, // Can be updated later on
  finalCost: {type: Number}, // The money to charge customer
  content: {type: String}, // Note
  status: {type: String, required: true},
  active: {type: Boolean, required: true}, // This should be false to prevent edit after certain stage
  type: {type: String, required: true}, // Online Order...

  currentLocation: {type: String, required: true, default: "Unknown"}, //Unknown, Oregon, HN, SG....
  origin: {type: String, required: true},
  destination: {type: String, required: true},
  shippingOptions: shippingOptionsSchema,

  creatorId: {type: String, required: true}, // Google id, has to be string
  creatorName: {type: String, required: true},

  filePaths: [{type: String}],
  timeline: [{type: mongoose.Types.ObjectId, ref: "History"}],
  comments: [{type: mongoose.Types.ObjectId, ref: "Comment"}]
}, { _id: false });


generalInfo.plugin(uniqueValidator); // Throw error if not unique
module.exports = mongoose.model('GeneralInfo', generalInfo);
