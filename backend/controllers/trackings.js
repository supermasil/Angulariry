const EasyPost = require('@easypost/api');
const api = new EasyPost(process.env.easyPostApiKey);
const OnlineTrackingModel = require('../models/tracking-models/online-tracking');
const ServicedTrackingModel = require('../models/tracking-models/serviced-tracking');
const InPersonTrackingModel = require('../models/tracking-models/in-person-tracking');
const ConsolidatedTrackingModel = require('../models/tracking-models/consolidated-tracking');
const MasterTrackingModel = require('../models/tracking-models/master-tracking');
const CarrierTrackingModel = require('../models/tracking-models/carrier-tracking');
const HistoryModel = require('../models/history');
const UserController = require("../controllers/users");
const CommentModel = require('../models/comment');
const db = require('mongoose');
const S3 = require('../shared/upload-files');
assert = require('assert');

const TrackingTypes = Object.freeze({
  ONLINE: "onl",
  SERVICED: "sev",
  INPERSON: "inp",
  CONSOLIDATED: "csl",
  MASTER: "mst"
});

// TRACKING TOOL
exports.getTrackingTool = async (req, res, next) => {
  try {
    let tracker = await getTrackerHelper(req.query.trackingNumber, req.query.carrier);
    return res.status(200).json(tracker);
  } catch (error) {
    console.log("getTrackingTool: " + error.message)
    return res.status(500).json({message: "Something went wrong while looking for this tracking"})
  }
};


// CREATE TRACKING
exports.createTracking = async (req, res, next) => {
  // console.log(JSON.stringify(req.body, null, 2));
  try {
    const session = await db.startSession();
    result =  await session.withTransaction(async () => {
      prefix = req.body.trackingNumber.substring(0, 3);
      createdTracking = null;
      req.historyId = (await createHistoryHelper(req.userData.uid, "Create", req.body.trackingNumber, session))._id;

      switch (prefix) {
        case TrackingTypes.ONLINE:
          const tracker = await getTrackerHelper(req.body.carrierTrackingNumber, req.body.carrier);
          assert(tracker !== null);

          tracking = new OnlineTrackingModel({
            trackingNumber: req.body.trackingNumber,

            carrierTracking: (await CarrierTrackingModel.create([{
              carrierTrackingNumber: req.body.carrierTrackingNumber,
              status: tracker.status,
              trackerId: tracker.id,
              carrier: req.body.carrier,
              postId: req.body.trackingNumber
            }], {session: session}).then(response => response[0]._id)),

            generalInfo: await generalInfoSetupHelper(req),
            itemList: itemsListSetupHelper(req)
          });
          await tracking.validate();
          // tracking.generalInfo.filePaths = await S3.uploadFiles(JSON.parse(req.body.files), JSON.parse(req.body.fileNames));
          console.log(tracking);
          // createdTracking =  await OnlineTrackingModel.create([tracking], {session: session}).then(createdTracking => { return createdTracking });
          break;

        case TrackingTypes.SERVICED:
          tracking = new ServicedTrackingModel({
            trackingNumber: req.body.trackingNumber,
            requestedItems: await requestItemsSetupHelper(req),
            generalInfo: await generalInfoSetupHelper(req),
            itemsList: itemsListSetupHelper(req)
          });
          await tracking.validate();
          tracking.generalInfo.filePaths = await S3.uploadFiles(JSON.parse(req.body.files), JSON.parse(req.body.fileNames));
          createdTracking =  await ServicedTrackingModel.create(tracking).then(createdTracking => { return createdTracking });
          break;

        case TrackingTypes.INPERSON:
          tracking = new InPersonTrackingModel({
            trackingNumber: req.body.trackingNumber,
            recipient: {
              name: req.body.recipient.name,
              email: req.body.recipient.email,
              phoneNumber: req.body.recipient.phoneNumber,
              address: {
                address: req.body.address.address,
                addressLineTwo: req.body.address.addressLineTwo,
                addressUrl: req.body.address.addressUrl
              }
            },
            generalInfo: await generalInfoSetupHelper(req),
            itemList: itemsListSetupHelper(req)
          });
          await tracking.validate();
          tracking.generalInfo.filePaths = await S3.uploadFiles(JSON.parse(req.body.files), JSON.parse(req.body.fileNames));
          createdTracking =  await InPersonTrackingModel.create(tracking).then(createdTracking => { return createdTracking });
          break;

        case TrackingTypes.CONSOLIDATED:
          tracking = new ConsolidatedTrackingModel({
            trackingNumber: req.body.trackingNumber,
            onlineTracking: JSON.parse(req.body.onlineTrackings),
            servicedTrackings: JSON.parse(req.body.servicedTrackings),
            inPersonTrackings: JSON.parse(req.body.inPersonTrackings),
            generalInfo: await generalInfoSetupHelper(req),
          });
          await tracking.validate();
          tracking.generalInfo.filePaths = await S3.uploadFiles(JSON.parse(req.body.files), JSON.parse(req.body.fileNames));
          createdTracking =  await ConsolidatedTrackingModel.create(tracking).then(createdTracking => { return createdTracking });
          break;

        case TrackingTypes.MASTER:
          tracking = new MasterTrackingModel({
            trackingNumber: req.body.trackingNumber,
            consolidatedTrackings: JSON.parse(req.body.consolidatedTrackings),
            generalInfo: await generalInfoSetupHelper(req),
          });
          await tracking.validate();
          tracking.generalInfo.filePaths = await S3.uploadFiles(JSON.parse(req.body.files), JSON.parse(req.body.fileNames));
          createdTracking =  await MasterTrackingModel.create(tracking).then(createdTracking => { return createdTracking });
          break;

        default:
          return res.status(500).json({message: "Tracking type doesn't match any"});
      }
    });

    session.endSession();
    console.info(`createTracking: Tracking created successfully: ${req.body.trackingNumber}`);
    return res.status(201).json({message: "Tracking created successfully", tracking: result});

  } catch (error) {
    console.error(`createTracking: ${req.body.trackingNumber}: ${error}`);
    return res.status(500).json({message: `Tracking creation failed, please check your info or contact Admin with this number ${req.body.trackingNumber}`});
  }
};

createHistoryHelper = async (userId, action, postId, session) => {
  return await HistoryModel.create([{
    userId: userId,
    action: action,
    postId: postId
  }], {session: session});
}

generalInfoSetupHelper = async req => {
  return {
    customerCode: req.body.customerCode,
    organizationId: req.body.organizationId,
    content: req.body.content,
    status: req.body.status,
    active: req.body.active,
    type: req.body.type,
    weight: req.body.weight,
    finalCost: req.body.finalCost,

    currentLocation: req.body.currentLocation,
    origin: req.body.origin,
    destination: req.body.destination,
    shippingOptions: {
      payAtDestination: req.body.payAtDestination,
      receiveAtDestination: req.body.receiveAtDestination
    },

    creatorId: req.userData.uid,
    creatorName: (await UserController.getUserByIdHelper(req.userData.uid)).name,

    comments: []
  };
}

itemsListSetupHelper = req => {
  itemsList = []

  JSON.parse(req.body.itemsList).forEach(item =>{
    itemList.push({
      itemName: item.itemName,
      declaredValue: item.declaredValue,
      quantity: item.quantity,
      insurance: item.insurance,
      weight: item.weight,
      extraCharge: item.extraCharge
    });
  });

  return itemList;
}

requestItemsSetupHelper = async req => {
  requestedItemsList = JSON.parse(req.body.requestedItems);

  requestedItems = []

  await requestedItemsList.forEach(item => {
    carrierTrackingIds = [];
    item.carrierTrackings.forEach(async item => {
      try {
        carrierTrackingIds.push((await getTrackerHelper(item.trackingNumber, item.carrier)).id);
      } catch (error) {
        console.error(`requestItemsSetupHelper: ${item.trackingNumber}: ${error.message}`); // then ignore the wrong tracking
      }
    });

    requestedItems.push({
      link: item.link,
      declaredValue: item.declaredValue,
      specifications: item.specifications,
      quantity: item.quantity,
      orderNumbers: item.orderNumbers,
      carrierTrackings: carrierTrackingIds
    });
  });

  return requestedItems;
}

exports.updateTracking = async(req, res , next) => {
  tracker = null;
  try {
    tracker = await getTrackerHelper(req.body.trackingNumber, req.body.carrier);
  } catch (error) {
    console.log("getTrackerHelper: " + error.message)
    return res.status(404).json({message: "Check your tracking number and carrier"});
  }

  return await onlineTracking.findOne({ _id: req.body._id, creatorId: req.userData.uid })
    .then(async (foundTracking) => {
        foundTracking.trackingNumber = req.body.trackingNumber;
        foundTracking.status = JSON.parse(req.body.received) ? "received_at_us_warehouse" : tracker.status,
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
        await S3.deleteFiles(filesToDelete);

        tempFilePaths = tempFilePaths.filter(item => !filesToDelete.includes(item));

        let fileNames = JSON.parse(req.body.fileNames);
        let newFilePaths = await S3.uploadFiles(JSON.parse(req.body.files), fileNames);
        tempFilePaths = [...tempFilePaths, ...newFilePaths];

        foundTracking.filePaths = tempFilePaths;
        await foundTracking.save();
        return res.status(201).json({message: "Tracking updated successfully", tracking: foundTracking});
      })
    .catch (error => {
      console.log("updateTracking: " + error.message);
      return res.status(500).json({message: "Tracking update failed"});
    });
}

exports.fuzzySearch = async (req, res, next) => {
  const trackingQuery = onlineTracking.fuzzySearch({ query: req.query.searchTerm, minSize: 2, exact: true});
  return await fetchTrackingsHelper(req, res, trackingQuery).populate('comments').exec()
    .then(documents => {
      fetchedTrackings = documents
      return documents.length;
    })
    .then(count => {
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
  const trackingQuery = onlineTracking.find();
  return await fetchTrackingsHelper(req, res, trackingQuery).populate('comments').exec()
    .then(documents => {
      fetchedTrackings = documents
      return onlineTracking.countDocuments();
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
  return await onlineTracking.findById(req.params.id).populate('comments').exec()
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
      let foundTracking = await onlineTracking.findById(req.params.id)
      .then();

      assert(foundTracking !== null);

      await onlineTracking.deleteOne({ _id: req.params.id, creatorId: req.userData.uid }).session(session)
      .then();

      await CommentModel.deleteMany({trackingId: req.params.id}).session(session)
      .then();

      await S3.deleteFiles(foundTracking.filePaths);

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

getTrackerHelper = async (trackingNumber, carrier) => {
  const tracker = new api.Tracker({
    tracking_code: trackingNumber,
    carrier: carrier
  });
  return await tracker.save()
    .then(savedTracker => {
      return savedTracker;
    });
};
