const mongoose = require('mongoose')

// This is only used at sub-document
const ListItemSchema = mongoose.Schema({
  itemName: {type: String, required: true},
  declaredValue: {type: Number, requried: true, default: 0},
  quantity: {type: Number, requried: true, default: 0},
  insurance: {type: String, requried: true},
  weight: {type: Number, requried: true, default: 0},
  extraCharge: {type: Number, requried: true, default: 0}
}, { _id: false });

module.exports = ListItemSchema;
