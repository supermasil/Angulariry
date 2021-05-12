const EasyPost = require('@easypost/api');
const api = new EasyPost(process.env.easyPostApiKey);
const CarrierTrackingModel = require('../models/tracking-models/carrier-tracking');
const app = require("../app");


exports.createCarrierTracking = async (carrierTrackingNumber, status, trackerId, carrier, trackingNumber, session) => {
  // console.log(carrierTrackingNumber, status, trackerId, carrier, trackingNumber);
  return await CarrierTrackingModel.create([{
    carrierTrackingNumber: carrierTrackingNumber,
    status: status,
    trackerId: trackerId,
    carrier: carrier,
    trackingNumber: trackingNumber
  }], {session: session}).then(result => {return result[0]});
}

exports.deleteCarrierTracking = async (carrierTrackingId) => {
  return await CarrierTrackingModel.findByIdAndDelete(carrierTrackingId).then();
}

exports.getCarrierTracking = async (carrierTrackingId) => {
  return await CarrierTrackingModel.findById(carrierTrackingId).then(result => result);
}

exports.updateCarrierTracking = async (carrierTrackingId, carrierTrackingNumber, status, trackerId, carrier, session) => {
  // console.log(carrierTrackingId, carrierTrackingNumber, status, trackerId, carrier);
  await CarrierTrackingModel.findByIdAndUpdate(carrierTrackingId, {$set: {
    carrierTrackingNumber: carrierTrackingNumber,
    status: status,
    trackerId: trackerId,
    carrier: carrier,
  }}, {new: true}).session(session).then(result => {return result});
}

exports.getTrackerHelper = async (trackingNumber, carrier) => {
  const tracker = new api.Tracker({
    tracking_code: trackingNumber,
    carrier: carrier
  });
  return await tracker.save()
    .then(savedTracker => {
      return savedTracker;
    });
};
