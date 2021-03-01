const mongoose = require('mongoose')

// This is only used at sub-document
const ListItemSchema = mongoose.Schema({
  name: {type: String, required: true},
  declaredValue: {type: Number, required: true, default: 0},
  quantity: {type: Number, required: true, default: 0},
  insurance: {type: Number, required: true},
  weight: {type: Number, required: true, default: 0},
  unitCharge: {type: Number, required: true, default: 0},
  extraCharge: {type: Number, required: true, default: 0},
  extraChargeUnit: {type: String, required: true},
  unitChargeSaving: {type: Number, required: true, default: 0},
  extraChargeSaving: {type: Number, required: true, default: 0},
  status: {type: String, required: true, default: "-"}
}, { _id: false });

module.exports = ListItemSchema;
