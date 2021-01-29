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
let assert = require('assert');
const { update } = require('../models/tracking-models/master-tracking');

const TrackingTypes = Object.freeze({
  ONLINE: "onl",
  SERVICED: "sev",
  INPERSON: "inp",
  CONSOLIDATED: "csl",
  MASTER: "mst"
});

const Statuses = Object.freeze({
  Unknown: "Unknown",
  Created: "Created",
  Pending: "Pending",
  Received: "Received",
  Consolidated: "Consolidated",
  ReadyToShip: "Ready to ship",
  Shipped: "Shipped",
  ArrivedAtDestination: "Arrived at Destination",
  Delivering: "Delivering",
  Delivered: "Delivered"});

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
      let prefix = req.body.generalInfo.trackingNumber.substring(0, 3);
      let createdTracking = null;

      switch (prefix) {
        case TrackingTypes.ONLINE:
          createdTracking = await createUpdateTrackingHelper(req, session, TrackingTypes.ONLINE, OnlineTrackingModel);
          break;
        case TrackingTypes.SERVICED:
          createdTracking = await createUpdateTrackingHelper(req, session, TrackingTypes.SERVICED, ServicedTrackingModel);
          break;
        case TrackingTypes.INPERSON:
          createdTracking = await createUpdateTrackingHelper(req, session, TrackingTypes.INPERSON, InPersonTrackingModel);
          break;
        case TrackingTypes.CONSOLIDATED:
          createdTracking = await createUpdateTrackingHelper(req, session, TrackingTypes.CONSOLIDATED, ConsolidatedTrackingModel);
          break;
        case TrackingTypes.MASTER:
          createdTracking = await createUpdateTrackingHelper(req, session, TrackingTypes.MASTER, MasterTrackingModel);
          break;
        default:
          return res.status(500).json({message: "Tracking type doesn't match any"});
      }

      // Audit
      if (req.body._id) {
        req.historyId = (await createHistoryHelper(req.userData.uid, "Update", req.body.generalInfo.trackingNumber, session))._id;
      } else {
        req.historyId = (await createHistoryHelper(req.userData.uid, "Create", req.body.generalInfo.trackingNumber, session))._id;
      }

      console.log(`createTracking: Tracking created successfully: ${createdTracking.trackingNumber}`);
      return res.status(201).json({message: "Tracking created successfully", tracking: createdTracking});
    });
    session.endSession();
  } catch (error) {
    console.error(`createTracking: ${req.body.generalInfo.trackingNumber}: ${error}`);
    console.error(`createTracking: ${req.body.generalInfo.trackingNumber}: ${JSON.stringify(error, null, 2)}`);
    return res.status(500).json({message: `Tracking creation failed, please check your info or contact Admin with tracking number ${req.body.generalInfo.trackingNumber}. If this is an online order, check if your carrier/ carrier tracking number is correct`});
  }
};

createUpdateTrackingHelper = async (req, session, type, MODEL) => {

  let tracker = null;
  if (type === TrackingTypes.ONLINE) {
    tracker = await CarrierTrackingController.getTrackerHelper(req.body.carrierTrackingNumber, req.body.carrier);
    assert(tracker !== null, "Tracker is null");
  }

  let generalInfo = await generalInfoSetupHelper(req);

  if (req.body._id) { //edit case
    let updateBody = {}

    let currentTracking = await MODEL.findById(req.body._id).then(result => result);

    if (type === TrackingTypes.ONLINE) {
      let currentCarrierTracking = await CarrierTrackingController.getCarrierTracking(currentTracking.carrierTracking);
      assert(currentCarrierTracking != null, "Carrier tracking number is null");
      if (currentCarrierTracking.carrier != req.body.carrier || currentCarrierTracking.carrierTrackingNumber != req.body.carrierTrackingNumber) {
        await CarrierTrackingController.updateCarrierTracking(currentTracking.carrierTracking, req.body.carrierTrackingNumber, tracker.status, tracker.id, req.body.carrier, session);
      }
      updateBody['received'] = req.body.received;
    }

    if (req.body.generalInfo.trackingNumber.includes(TrackingTypes.ONLINE) || req.body.generalInfo.trackingNumber.includes(TrackingTypes.INPERSON) || req.body.generalInfo.trackingNumber.includes(TrackingTypes.ONLINE)) {
      updateBody['itemsList'] = itemsListSetupHelper(req)
    }

    if (type === TrackingTypes.CONSOLIDATED) {
      updateBody['onlineTrackings'] = req.body.onlineTrackings;
      updateBody['servicedTrackings'] = req.body.servicedTrackings;
      updateBody['inPersonTrackings'] = req.body.inPersonTrackings;
      changeTrackingsStatusHelper(TrackingTypes.ONLINE, Statuses.Consolidated, req.body.onlineTrackings);
      changeTrackingsStatusHelper(TrackingTypes.SERVICED, Statuses.Consolidated, req.body.servicedTrackings);
      changeTrackingsStatusHelper(TrackingTypes.INPERSON, Statuses.Consolidated, req.body.inPersonTrackings);
      changeTrackingsStatusHelper(TrackingTypes.ONLINE, Statuses.Pending, req.body.removedOnlineTrackings);
      changeTrackingsStatusHelper(TrackingTypes.SERVICED, Statuses.Pending, req.body.removedServicedTrackings);
      changeTrackingsStatusHelper(TrackingTypes.INPERSON, Statuses.Pending, req.body.removedInPersonTrackings);
    }

    if (type === TrackingTypes.MASTER) {
      updateBody['boxes'] = req.body.boxes;
      req.body.boxes.forEach(box => {
        changeTrackingsStatusHelper(TrackingTypes.CONSOLIDATED, Statuses.ReadyToShip, box.items);
      });
      changeTrackingsStatusHelper(TrackingTypes.CONSOLIDATED, Statuses.Pending, req.body.removedConsolidatedTrackingNumbers);
    }

    generalInfo['filePaths'] = await updateImages(req, currentTracking.generalInfo.filePaths);
    updateBody['generalInfo'] = generalInfo;

    return await MODEL.findByIdAndUpdate(req.body._id, updateBody, {new: true}).session(session).then(result => {return result});

  } else { // create case

    newBody = {
      trackingNumber: req.body.generalInfo.trackingNumber
      // linkedTo: req.body.linkedTo? req.body.linkedTo: []
    }

    if (type === TrackingTypes.ONLINE) {
      let newcarrierTracking = await CarrierTrackingController.createCarrierTracking(req.body.carrierTrackingNumber, tracker.status, tracker.id, req.body.carrier, req.body.generalInfo.trackingNumber, session);
      newBody['carrierTracking'] = newcarrierTracking._id,
      newBody['received'] = req.body.received
    }

    if (req.body.generalInfo.trackingNumber.includes(TrackingTypes.ONLINE) || req.body.generalInfo.trackingNumber.includes(TrackingTypes.INPERSON) || req.body.generalInfo.trackingNumber.includes(TrackingTypes.ONLINE)) {
      newBody['itemsList'] = itemsListSetupHelper(req)
    }

    if (type === TrackingTypes.CONSOLIDATED) {
      newBody['onlineTrackings'] = req.body.onlineTrackings;
      newBody['servicedTrackings'] = req.body.servicedTrackings;
      newBody['inPersonTrackings'] = req.body.inPersonTrackings;
      changeTrackingsStatusHelper(TrackingTypes.ONLINE, Statuses.Consolidated, req.body.onlineTrackings);
      changeTrackingsStatusHelper(TrackingTypes.SERVICED, Statuses.Consolidated, req.body.servicedTrackings);
      changeTrackingsStatusHelper(TrackingTypes.INPERSON, Statuses.Consolidated, req.body.inPersonTrackings);
    }

    if (type === TrackingTypes.MASTER) {
      newBody['boxes'] = req.body.boxes;
      req.body.boxes.forEach(box => {
        changeTrackingsStatusHelper(TrackingTypes.CONSOLIDATED, Statuses.ReadyToShip, box.items);
      });
    }

    generalInfo['filePaths'] = await addImages(req);
    newBody['generalInfo'] = generalInfo;

    tracking = new MODEL(newBody);

    await tracking.validate();
    return await MODEL.create([tracking], {session: session}).then(createdTracking => {return createdTracking[0]});
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
    status: req.body.generalInfo.status? req.body.generalInfo.status : "Created",
    active: req.body.generalInfo.active? req.body.generalInfo.active : true,

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
  try {
    assert(req.query.type != undefined, "Query type is undefined");
    assert(req.query.orgId != null, "orgId is null");

    queryBody = {
      'generalInfo.organizationId': req.query.orgId
    }

    if (req.query.origin) {
      queryBody['generalInfo.origin'] = req.query.origin;
    }

    if (req.query.destination) {
      queryBody['generalInfo.destination'] = req.query.destination;
    }

    if (req.query.sender) {
      queryBody['generalInfo.sender'] = req.query.sender;
    }

    let extraPopulation1 = ''

    let trackingQuery = null;

    let totalCount = 0;

    switch (req.query.type) {
      case TrackingTypes.ONLINE:
        trackingQuery = OnlineTrackingModel.find(queryBody);
        totalCount = await OnlineTrackingModel.countDocuments().then(count => {return count});
        extraPopulation1 = 'carrierTracking'
        break;
      case TrackingTypes.SERVICED:
        trackingQuery = ServicedTrackingModel.find(queryBody);
        totalCount = await ServicedTrackingModel.countDocuments().then(count => {return count});
        break;
      case TrackingTypes.INPERSON:
        trackingQuery = InPersonTrackingModel.find(queryBody);
        totalCount = await InPersonTrackingModel.countDocuments().then(count => {return count});
        break;
      case TrackingTypes.CONSOLIDATED:
        trackingQuery = ConsolidatedTrackingModel.find(queryBody);
        totalCount = await ConsolidatedTrackingModel.countDocuments().then(count => {return count});
        break;
      case TrackingTypes.MASTER:
        trackingQuery = MasterTrackingModel.find(queryBody);
        totalCount = await MasterTrackingModel.countDocuments().then(count => {return count});
        break;
    }

    assert(trackingQuery != null, "trackingQuery is null");

    return await fetchTrackingsHelper(req, res, trackingQuery).populate('generalInfo.comments').populate(extraPopulation1).exec()
      .then(documents => {
        fetchedTrackings = documents
        return totalCount;
      })
      .then(count => {
        return res.status(200).json({
          // No error message needed
          trackings: fetchedTrackings,
          count: count
        });
      })
  } catch(error) {
    console.log("getTrackings: " + error.message);
    return res.status(500).json({message: "Couldn't fetch trackings"});
  };
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

exports.getTracking = async (req, res, next) => {
  try {
    switch(req.params.id.substring(0, 3)) {
      case TrackingTypes.ONLINE:
        return await OnlineTrackingModel.findOne({trackingNumber: req.params.id, 'generalInfo.organizationId': req.params.orgId}).populate('carrierTracking').exec()
          .then(tracking => {
            assert(tracking != null);
            return res.status(200).json(tracking);
          });
      case TrackingTypes.SERVICED:
        break;
      case TrackingTypes.INPERSON:
        return await InPersonTrackingModel.findOne({trackingNumber: req.params.id, 'generalInfo.organizationId': req.params.orgId})
          .then(tracking => {
            assert(tracking != null);
            return res.status(200).json(tracking);
          });
      case TrackingTypes.CONSOLIDATED:
        return await ConsolidatedTrackingModel.findOne({trackingNumber: req.params.id, 'generalInfo.organizationId': req.params.orgId})
        .populate('onlineTrackings')
        .populate('servicedTrackings')
        .populate('inPersonTrackings')
          .then(tracking => {
            assert(tracking != null);
            return res.status(200).json(tracking);
          });
      case TrackingTypes.MASTER:
        return await MasterTrackingModel.findOne({trackingNumber: req.params.id, 'generalInfo.organizationId': req.params.orgId})
        .populate('boxes.items')
          .then(tracking => {
            assert(tracking != null);
            return res.status(200).json(tracking);
          });
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

changeTrackingsStatusHelper = (type, status, idsList) => {
  switch (type) {
    case TrackingTypes.ONLINE:
      OnlineTrackingModel.updateMany({"_id": {$in: idsList}}, {$set:{"generalInfo.status": status}}).then();
      break;
    case TrackingTypes.SERVICED:
      ServicedTrackingModel.updateMany({"_id": {$in: idsList}}, {$set:{"generalInfo.status": status}}).then();
      break;
    case TrackingTypes.INPERSON:
      InPersonTrackingModel.updateMany({"_id": {$in: idsList}}, {$set:{"generalInfo.status": status}}).then();
      break;
    case TrackingTypes.CONSOLIDATED:
      ConsolidatedTrackingModel.updateMany({"_id": {$in: idsList}}, {$set:{"generalInfo.status": status}}).then();
      break;
    case TrackingTypes.MASTER:
      MasterTrackingModel.updateMany({"_id": {$in: idsList}}, {$set:{"generalInfo.status": status}}).then();
      break;
  }
}

