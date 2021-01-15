const mongoose = require('mongoose')

// This is only used at sub-document
const ListItemSchema = mongoose.Schema({
  itemName: {type: String, required: true},
  declaredValue: {type: Number, required: true, default: 0},
  quantity: {type: Number, required: true, default: 0},
  insurance: {type: String, required: true},
  weight: {type: Number, required: true, default: 0},
  unitCharge: {type: Number, required: true, default: 0},
  extraCharge: {type: Number, required: true, default: 0},
  status: {type: String, default: "Unknown"}
}, { _id: false });

module.exports = ListItemSchema;
