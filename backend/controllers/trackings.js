const OnlineTrackingModel = require('../models/tracking-models/online-tracking');
const ServicedTrackingModel = require('../models/tracking-models/serviced-tracking');
const InPersonTrackingModel = require('../models/tracking-models/in-person-tracking');
const ConsolidatedTrackingModel = require('../models/tracking-models/consolidated-tracking');
const MasterTrackingModel = require('../models/tracking-models/master-tracking');
const HistoryModel = require('../models/history');
const UserController = require("../controllers/users");
const CarrierTrackingController = require("../controllers/carrier-trackings");
const CommentModel = require('../models/comment');
const db = require('mongoose');
const S3 = require('../shared/upload-files');
const { assert } = require('console');
require('assert');

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
    await session.withTransaction(async () => {
      prefix = req.body.generalInfo.trackingNumber.substring(0, 3);
      createdTracking = null;
      if (req.body._id) {
        req.historyId = (await createHistoryHelper(req.userData.uid, "Update", req.body.generalInfo.trackingNumber, session))._id;
      } else {
        req.historyId = (await createHistoryHelper(req.userData.uid, "Create", req.body.generalInfo.trackingNumber, session))._id;
      }
      switch (prefix) {
        case TrackingTypes.ONLINE:
          createdTracking = await createUpdateOnlineTracking(req, session);
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
      console.log(`createTracking: Tracking created successfully: ${createdTracking.trackingNumber}`);
      return res.status(201).json({message: "Tracking created successfully", tracking: createdTracking});
    });
    session.endSession();
  } catch (error) {
    console.error(`createTracking: ${req.body.generalInfo.trackingNumber}: ${error}`);
    return res.status(500).json({message: `Tracking creation failed, please check your info or contact Admin with tracking number ${req.body.generalInfo.trackingNumber}. If this is an online order, check if your carrier/ carrier tracking number is correct`});
  }
};

createUpdateOnlineTracking = async (req, session) => {
  const tracker = await CarrierTrackingController.getTrackerHelper(req.body.carrierTrackingNumber, req.body.carrier);
  assert(tracker !== null);

  if (req.body._id) { //edit case
    let currentTracking = await OnlineTrackingModel.findById(req.body._id).then(result => result);
    let currentCarrierTracking = await CarrierTrackingController.getCarrierTracking(currentTracking.carrierTracking);
    assert(currentCarrierTracking != null, "Carrier tracking number is null");

    if (currentCarrierTracking.carrier != req.body.carrier || currentCarrierTracking.carrierTrackingNumber != req.body.carrierTrackingNumber) {
      await CarrierTrackingController.updateCarrierTracking(currentTracking.carrierTracking, req.body.carrierTrackingNumber, tracker.status, tracker.id, req.body.carrier, session);
    }

    let generalInfo = await generalInfoSetupHelper(req);
    generalInfo['filePaths'] = await updateImages(req, currentTracking.generalInfo.filePaths);

    return await OnlineTrackingModel.findByIdAndUpdate(req.body._id, {
      generalInfo: generalInfo,
      itemsList: itemsListSetupHelper(req),
    }, {new: true}).session(session).then(result => {return result});

  } else { // create case
    let newcarrierTracking = await CarrierTrackingController.createCarrierTracking(req.body.carrierTrackingNumber, tracker.status, tracker.id, req.body.carrier, req.body.generalInfo.trackingNumber, session);
    let generalInfo = await generalInfoSetupHelper(req);
    generalInfo['filePaths'] = await addImages(req);

    tracking = new OnlineTrackingModel({
      trackingNumber: req.body.generalInfo.trackingNumber,
      carrierTracking: newcarrierTracking._id,
      generalInfo: generalInfo,
      itemsList: itemsListSetupHelper(req)
      // linkedTo: req.body.linkedTo? req.body.linkedTo: []
    });
    await tracking.validate();
    return await OnlineTrackingModel.create([tracking], {session: session}).then(createdTracking => {return createdTracking[0]});
  }
}

createHistoryHelper = async (userId, action, postId, session) => {
  return await HistoryModel.create([{
    userId: userId,
    action: action,
    postId: postId
  }], {session: session});
}

generalInfoSetupHelper = async req => {
  return {
    sender: req.body.generalInfo.sender,
    recipient: req.body.generalInfo.recipient,
    organizationId: req.body.organizationId,
    content: req.body.content,
    // status: req.body.status? req.body.status : "Unknown",
    active: req.body.active? req.body.active : true,

    totalWeight: req.body.finalizedInfo.totalWeight,
    finalCost: req.body.finalizedInfo.finalCost,
    costAdjustment: req.body.finalizedInfo.costAdjustment,

    currentLocation: req.body.currentLocation? req.body.currentLocation : req.body.generalInfo.origin,
    origin: req.body.generalInfo.origin,
    destination: req.body.generalInfo.destination,
    shippingOptions: {
      payAtDestination: req.body.payAtDestination? req.body.payAtDestination : false,
      receiveAtDestination: req.body.receiveAtDestination? req.body.receiveAtDestination : false
    },

    creatorId: req.userData.uid,
    creatorName: (await UserController.getUserByIdHelper(req.userData.uid)).name
    // comments: req.body.comments? req.body.comments : []
  };
}

itemsListSetupHelper = req => {
  itemsList = [];
  req.body.itemsList.forEach(item =>{
    itemsList.push({
      name: item.name,
      declaredValue: item.declaredValue,
      quantity: item.quantity,
      insurance: item.insurance,
      weight: item.weight,
      unitCharge: item.unitCharge,
      extraCharge: item.extraCharge,
      extraChargeUnit: item.extraChargeUnit,
      unitChargeSaving: item.unitChargeSaving,
      extraChargeSaving: item.extraChargeSaving
      // status: item.status
    });
  });

  return itemsList;
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

        let fileNames = JSON.parse(req.body.fileNamesToAdd);
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

addImages = async (req) => {
  filePaths = await S3.uploadFiles(JSON.parse(req.body.filesToAdd), JSON.parse(req.body.fileNamesToAdd));
  return filePaths
}

updateImages = async (req, currentFilesPath) => {
  let tempFilePaths = currentFilesPath;
  let filesToDelete = JSON.parse(req.body.filesToDelete); // Parse the array
  await S3.deleteFiles(filesToDelete);
  tempFilePaths = tempFilePaths.filter(item => !filesToDelete.includes(item));
  let fileNames = JSON.parse(req.body.fileNamesToAdd);
  let newFilePaths = await S3.uploadFiles(JSON.parse(req.body.filesToAdd), fileNames);
  tempFilePaths = [...tempFilePaths, ...newFilePaths];
  return tempFilePaths;
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
  try {
    switch(req.params.id.substring(0, 3)) {
      case TrackingTypes.ONLINE:
        return await OnlineTrackingModel.findOne({trackingNumber: req.params.id}).populate('carrierTracking').exec()
          .then(tracking => {
            assert(tracking != null);
            return res.status(200).json(tracking);
          })
      case TrackingTypes.SERVICED:
        break;
      case TrackingTypes.INPERSON:
        break;
      case TrackingTypes.CONSOLIDATED:
        break;
      case TrackingTypes.MASTER:
        break;
      default:
        return res.status(500).json({message: "Couldn't fetch tracking"});
    }
  } catch(error) {
    console.log(`getTracking: ${req.params.id} ${error.message}`);
    return res.status(500).json({message: "Couldn't fetch tracking"});
  };
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


