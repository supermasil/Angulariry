
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const fuzzySearch = require('mongoose-fuzzy-searching');

const GeneralInfoSchema = require('./general-info-schema');

const masterTrackingSchema = mongoose.Schema({
  trackingNumber: {type: String, required: true, unique: true, index: true},
  boxes: [{
    boxNumber: {type: String, required: true},
    palletNumber: {type: String, required: true},
    onlineTrackings: [{type: mongoose.Types.ObjectId, ref: "online-tracking"}],
    servicedTrackings: [{type: mongoose.Types.ObjectId, ref: "serviced-tracking"}],
    inPersonTrackings: [{type: mongoose.Types.ObjectId, ref: "in-person-tracking"}],
    content: {type: String, default: ''}
  }],
  generalInfo: {type: GeneralInfoSchema, required: true}
}, {timestamps: true, autoCreate: true });

masterTrackingSchema.plugin(uniqueValidator); // Throw error if not unique

module.exports = mongoose.model('master-tracking', masterTrackingSchema);
