const EasyPost = require('@easypost/api');
const api = new EasyPost(process.env.easyPostApiKey);
const Tracking = require('../models/tracking');
const db = require('mongoose');


// const apiKey = new Api(process.env.easyPostApiKey, {
//   timeout: 120000,
//   baseUrl: "https://api.easypost.com/v2/",
//   useProxy: false,
//   superagentMiddleware: s => s,
//   requestMiddleware: r => r,
// });

exports.getTrackingTool = async (req, res, next) => {
  try {
    let tracker = await getTrackerHelper(req);
    return res.status(200).json(tracker);
  } catch (error) {
    console.log("getTrackingTool: " + error.message)
    return res.status(500).json({message: error.message.includes("**") ? error.message : "Something went wrong while looking for this tracking"})
  }
};

exports.createTracking = async (req, res, next) => {
  try {
    let tracking = await createTrackingHelper(req);
    return res.status(201).json({message: "Tracking created successfully", tracking: tracking});
  } catch (error) {
    console.log("createTracking: " + error.message);
    return res.status(500).json({message: error.message.includes("**") ? error.message : "Tracking creation failed"});
  }
};

exports.updateTracking = async(req, res , next) => {
  try {
    let tracking = await updateTrackingHelper(req);
    return res.status(201).json({message: "Tracking updated successfully", tracking: tracking});
  } catch (error) {
    console.log("updateTracking: " + error.message);
    return res.status(500).json({message: error.message.includes("**") ? error.message : "Tracking update failed"});
  }
}

exports.getTrackings = (req, res, next) => {
  // Pagination
  const pageSize = +req.query.pageSize; // Convert to int
  const currentPage = +req.query.currentPage;
  const trackingQuery = Tracking.find();
  let fetchedTrackings;
  if (pageSize && currentPage) {
    trackingQuery
      .skip(pageSize * (currentPage - 1))
      .limit(pageSize);
  }

  trackingQuery.sort({createdAt: -1})
    .then(documents => {
      fetchedTrackings = documents
      return Tracking.countDocuments();
    })
    .then(count => {
      return res.status(200).json({
        // No error message needed
        trackings: fetchedTrackings,
        maxTrackings: count
      });
    })
    .catch(error => {
      console.log("getTrackings: " + error.message);
      return res.status(500).json({message: "Couldn't fetch trackings"});
    });
}

exports.getTracking = (req, res, next) => {
  Tracking.findById(req.params.id)
  .then(tracking => {
    return res.status(200).json(tracking);
  })
  .catch(error => {
    console.log("getTracking: " + error.message);
    return res.status(500).json({message: "Couldn't fetch tracking"});
  });
}

exports.deleteTracking = (req, res, next) => {
  Tracking.deleteOne({ _id: req.params.id, creator: req.userData.uid })
  .then(deletedTracking => {
    if (deletedTracking.n > 0) {
      return res.status(201).json({message: "Tracking deleted sucessfully"});
    } else {
      return res.status(404).json({message: "No tracking was deleted"});
    }
  })
  .catch(error => {
    console.log(error.message);
    return res.status(500).json({message: "Tracking deletion failed"});
  });
}

createTrackingHelper = async(req) => {
  const tracker = await getTrackerHelper(req);
  const tracking = new Tracking({
    trackingNumber: req.body.trackingNumber,
    status: tracker.status,
    carrier: req.body.carrier,
    imagePath: getImagePathHelper(req),
    creator: req.userData.uid,
    trackerId: tracker.id,
    content: req.body.content !== "null" ? req.body.content : null,
    active: true,
    timeline: [{
      user: req.userData.uid,
      action: "Tracking created"
    }]
  });

  return await Tracking.create(tracking)
    .then(createdTracking => {
      return createdTracking;
    });
}

updateTrackingHelper = async (req) => {
  const tracker = await getTrackerHelper(req);
  return await Tracking.findOne({ _id: req.body._id, creator: req.userData.uid })
    .then(async (foundTracking) => {
        foundTracking.trackingNumber = req.body.trackingNumber;
        foundTracking.status = tracker.status,
        foundTracking.carrier = req.body.carrier,
        foundTracking.imagePath = getImagePathHelper(req),
        foundTracking.creator = req.userData.uid,
        foundTracking.trackerId = tracker.id,
        foundTracking.content = req.body.content,
        foundTracking.active = true,
        foundTracking.timeline.unshift({
          user: req.userData.uid,
          action: "Tracking updated"
        })
        return await foundTracking.save();
      })
}

getImagePathHelper = (req) => {
  if (req.file) { // New image
    const url = req.protocol + '://' + req.get('host');
    return imagePath = url + '/images/' + req.file.filename;
  } else { // Old image
    return imagePath = req.body.image;
  }
}

getTrackerHelper = async (req) => {
  try {
    const tracker = new api.Tracker({
      tracking_code: req.query.trackingNumber ? req.query.trackingNumber : req.body.trackingNumber,
      carrier: req.query.carrier ? req.query.carrier : req.body.carrier
    });
    return await tracker.save()
    .then(foundTracker => {
      return foundTracker;
    });
  } catch (error) {
    console.log("getTrackerHelper: " + error.message);
    throw new Error("** Check your tracking number and carrier");
  }
};
