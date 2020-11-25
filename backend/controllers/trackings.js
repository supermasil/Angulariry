const EasyPost = require('@easypost/api');
const api = new EasyPost(process.env.easyPostApiKey);
const Tracking = require('../models/tracking');
const Comment = require('../models/comment');
const db = require('mongoose');
const S3 = require('../shared/upload-files');
const { assert } = require('console');
const { assertNotNull } = require('@angular/compiler/src/output/output_ast');

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
    tracker = null;
    try {
      tracker = await getTrackerHelper(req);
    } catch (error) {
      console.log("getTrackerHelper: " + error.message)
      return res.status(404).json({message: "Check your tracking number and carrier"});
    }

    const tracking = new Tracking({
      trackingNumber: req.body.trackingNumber,
      status: tracker.status,
      carrier: req.body.carrier,
      filePaths: [],
      creatorId: req.userData.uid,
      trackerId: tracker.id,
      content: req.body.content !== "null" ? req.body.content : null,
      active: true,
      timeline: [{
        userId: req.userData.uid,
        action: "Tracking created"
      }]
    });

    // Validate before uploading files
    await tracking.validate();

    tracking.filePaths = await S3.uploadFiles(req.files);

    return await Tracking.create(tracking)
      .then(createdTracking => {
        return res.status(201).json({message: "Tracking created successfully", tracking: createdTracking});
      });

  } catch (error) {
    console.log("createTracking: " + error.message);
    return res.status(500).json({message: "Tracking creation failed, try to search to see if it already exists"});

  }

};

exports.updateTracking = async(req, res , next) => {
  tracker = null;

  try {
    tracker = await getTrackerHelper(req);
  } catch (error) {
    console.log("getTrackerHelper: " + error.message)
    return res.status(404).json({message: "Check your tracking number and carrier"});
  }

  return await Tracking.findOne({ _id: req.body._id, creatorId: req.userData.uid })
    .then(async (foundTracking) => {
        foundTracking.trackingNumber = req.body.trackingNumber;
        foundTracking.status = tracker.status,
        foundTracking.carrier = req.body.carrier,
        foundTracking.creatorId = req.userData.uid,
        foundTracking.trackerId = tracker.id,
        foundTracking.content = req.body.content,
        foundTracking.active = true,
        foundTracking.timeline.unshift({
          userId: req.userData.uid,
          action: "Tracking updated"
        })

        let tempFilePaths = foundTracking.filePaths;

        let filesToDelete = JSON.parse(req.body.filesToDelete); // Parse the array
        S3.deleteFiles(filesToDelete);
        tempFilePaths = tempFilePaths.filter(item => !filesToDelete.includes(item));

        let newFilePaths = await S3.uploadFiles(req.files);
        tempFilePaths = [...tempFilePaths, ...newFilePaths];

        foundTracking.filePaths = tempFilePaths;
        await foundTracking.save();
        return res.status(201).json({message: "Tracking updated successfully", tracking: foundTracking});


      })
    .catch (error => {
      console.log("updateTracking: " + error.message);
      return res.status(500).json({message: "Tracking update failed, try to search to see if it already exists"});
    });
}

exports.fuzzySearch = async (req, res, next) => {
  const trackingQuery = Tracking.fuzzySearch({ query: req.query.searchTerm, minSize: 2});
  return await fetchTrackingsHelper(req, res, trackingQuery).populate('comments').exec()
    .then(documents => {
      fetchedTrackings = documents
      return documents.length;
    })
    .then(count => {
      console.log(fetchedTrackings);
      return res.status(200).json({
        // No error message needed
        trackings: fetchedTrackings,
        count: count
      });
    })
    .catch(error => {
      console.log("fuzzySearch: " + error.message);
      return res.status(500).json({message: "Couldn't search for this term"});
    });
}

exports.getTrackings = async (req, res, next) => {
  const trackingQuery = Tracking.find();
  return await fetchTrackingsHelper(req, res, trackingQuery).populate('comments').exec()
    .then(documents => {
      fetchedTrackings = documents
      return Tracking.countDocuments();
    })
    .then(count => {
      return res.status(200).json({
        // No error message needed
        trackings: fetchedTrackings,
        count: count
      });
    })
    .catch(error => {
      console.log("getTrackings: " + error.message);
      return res.status(500).json({message: "Couldn't fetch trackings"});
    });
}

exports.getTracking = async (req, res, next) => {
  return await Tracking.findById(req.params.id).populate('comments').exec()
  .then(tracking => {
    return res.status(200).json(tracking);
  })
  .catch(error => {
    console.log("getTracking: " + error.message);
    return res.status(500).json({message: "Couldn't fetch tracking"});
  });
}

exports.deleteTracking = async (req, res, next) => {
  try {
    const session = await db.startSession();
    return await session.withTransaction(async () => {
      let foundTracking = await Tracking.findById(req.params.id)
      .then();

      assertNotNull(foundTracking);

      await Tracking.deleteOne({ _id: req.params.id, creatorId: req.userData.uid }).session(session)
      .then();

      await Comment.deleteMany({trackingId: req.params.id}).session(session)
      .then();

      S3.deleteFiles(foundTracking.filePaths);

      return res.status(200).json({message: "Tracking deleted successfully"});
    })
  } catch(error) {
    console.log("deleteTracking: " + error.message);
    return res.status(500).json({message: "Tracking deletion failed"});
  }
}

fetchTrackingsHelper = (req, res, trackingQuery) => {
  // Pagination
  const pageSize = +req.query.pageSize; // Convert to int
  const currentPage = +req.query.currentPage;
  let fetchedTrackings;
  if (pageSize && currentPage) {
    trackingQuery
      .skip(pageSize * (currentPage - 1))
      .limit(pageSize);
  }
  return trackingQuery.sort({createdAt: -1});
}

// getImagePathHelper = (req) => {
//   if (req.file) { // New image
//     const url = req.protocol + '://' + req.get('host');
//     return imagePath = url + '/images/' + req.file.filename;
//   } else { // Old image
//     return imagePath = req.body.image;
//   }
// }

getTrackerHelper = async (req) => {
  const tracker = new api.Tracker({
    tracking_code: req.query.trackingNumber ? req.query.trackingNumber : req.body.trackingNumber,
    carrier: req.query.carrier ? req.query.carrier : req.body.carrier
  });
  return await tracker.save()
    .then(savedTracker => {
      return savedTracker;
    })
};
