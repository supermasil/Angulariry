const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const discountSchema = mongoose.Schema({
  userId: {type: String, ref: "user", index: true},
  perUnitDiscountUnit: {type: String, default: 0},
  perUnitDiscountAmount: {type: Number, default: 0},
  extraChargeDiscountUnit: {type: String, default: 0},
  extraChargeDiscountAmount: {type: Number, default: 0},
}, {_id: false});

const destinationSchema = mongoose.Schema({
  name: {type: String, required: true}, // Unique validation happens in front end
  pricePerUnit: {type: Number, require: true, default: 0},
  extraCharge: {type: Number, require: true, default: 0},
  extraChargeUnit: {type: String, require: true},
  discounts: [discountSchema]
});

const routeSchema = mongoose.Schema({
  origin: {type: String, required: true},
  destinations: [destinationSchema]
});

const itemSchema = mongoose.Schema({
  name: {type: String, required: true},
  unit: {type: String, required: true, default: "kg"},
  routes: [routeSchema],
  active: {type: Boolean, required: true, default: true},
  content: {type: String, default: ''}
}, { timestamps: true });

const pricingSchema = mongoose.Schema({
  organization: {type: mongoose.Types.ObjectId, ref: "organization", index: true},
  items: [itemSchema]
}, { timestamps: true, autoCreate: true });

pricingSchema.plugin(uniqueValidator); // Throw error if not unique

module.exports = mongoose.model('pricing', pricingSchema);
