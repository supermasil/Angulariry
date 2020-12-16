const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

// This is only used at sub-document
const listItem = mongoose.Schema({
  itemName: {type: String, required: true},
  declaredValue: {type: Number, requried: true},
  quantity: {type: Number, requried: true},
  insurance: {type: String, requried: true},
  weight: {type: Number, requried: true},
  extraCharge: {type: Number, requried: true}
}, { _id: false });


listItem.plugin(uniqueValidator); // Throw error if not unique
module.exports = mongoose.model('listItem', listItem);
