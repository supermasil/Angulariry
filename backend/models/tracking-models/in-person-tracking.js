const mongoose = require('mongoose');

const inPersonSubTrackingSchema = require('./in-person-tracking-sub');
const GeneralInfoSchema = require('./general-info-schema');

const inPersonTrackingSchema = mongoose.Schema({
  trackingNumber: {type: String, required: true, unique: true, index: true},
  generalInfo: {type: GeneralInfoSchema, required: true},
  subTrackings: [{type: mongoose.Types.ObjectId, ref: "in-person-tracking-sub"},]
}, {timestamps: true, autoCreate: true });

module.exports = mongoose.model('in-person-tracking', inPersonTrackingSchema);
