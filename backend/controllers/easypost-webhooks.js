const CarrierTrackingController = require("../controllers/carrier-trackings");

//{"id":"hook_45098b81d06e412ba3f02306cbfedf9b","object":"Webhook","mode":"production","url":"https://weshippee.com/api/easypost","disabled_at":null}

exports.updateTracker = (req, res, next) => {
  if (req.body.result.status === "unknown") {
    console.log(`EasyPostWebhook: Ignore updating for status unknown`);
    return;
  }

  CarrierTrackingController.updateOne({ carrierTrackingNumber: req.body.result.tracking_code}, {status: req.body.result.status })
    .then(
      console.log(`EasyPostWebhook: Updated tracking ${req.body.result.tracking_code} to status ${req.body.result.status}`)
    )
    .catch(
      console.log(`EasyPostWebhook: Failed to update status of tracking ${req.body.result.tracking_code}`)
    )
}


// {
//   "description": "tracker.created",
//   "mode": "production",
//   "previous_attributes": {},
//   "created_at": "2020-11-26T20:17:20.000Z",
//   "pending_urls": [
//     "https://weshippee.com/api/easypost"
//   ],
//   "completed_urls": [],
//   "updated_at": "2020-11-26T20:17:20.000Z",
//   "id": "evt_b441a953b39748d4959c47af9d7743f1",
//   "user_id": "user_0777fe1395a9438f84544006152b0bf3",
//   "status": "pending",
//   "object": "Event",
//   "result": {
//     "id": "trk_117dee57e33d40c8892c29a3f2fee617",
//     "object": "Tracker",
//     "mode": "production",
//     "tracking_code": "1ZKJT738P200027617",
//     "status": "unknown",
//     "status_detail": "unknown",
//     "created_at": "2020-11-26T20:16:50Z",
//     "updated_at": "2020-11-26T20:16:50Z",
//     "signed_by": null,
//     "weight": null,
//     "est_delivery_date": null,
//     "shipment_id": null,
//     "carrier": "UPS",
//     "tracking_details": [],
//     "carrier_detail": null,
//     "finalized": false,
//     "is_return": false,
//     "public_url": "https://track.easypost.com/djE6dHJrXzExN2RlZTU3ZTMzZDQwYzg4OTJjMjlhM2YyZmVlNjE3"
//   }
// }
