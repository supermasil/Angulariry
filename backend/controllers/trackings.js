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
const onlineTracking = require('../models/tracking-models/online-tracking');

const TrackingTypes = Object.freeze({
  ONLINE: "onl",
  SERVICED: "sev",
  INPERSON: "inp",
  CONSOLIDATED: "csl",
  MASTER: "mst",
});

const trackingStatuses = {
  Unknown: "Unknown",
  Created: "Created",
  Pending: "Pending",
  BeingShippedToOrigin: "Being shipped to origin",
  ReceivedAtOrigin: "Received at origin",
  ReadyToFly: "Ready to fly",
  Flying: "Flying",
  ReceivedAtDestination: "Received at destination",
  BeingDeliveredToRecipient: "Being delivered to recipient",
  DeliveredToRecipient: "Delivered to recipient",
}

const financialStatuses = {
  Unpaid: "Unpaid",
  Paid: "Paid",
  PartiallyPaid: "Partially paid"
}

const allEqual = arr => arr.every( v => v === arr[0]);

const postReceivedAtDestinationStatuses = Object.values(trackingStatuses).slice(7);

// TRACKING TOOL
exports.getTrackingTool = async (req, res, next) => {
  try {
    let tracker = await CarrierTrackingController.getTrackerHelper(req.query.trackingNumber, req.query.carrier);
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
    let createdTracking = null;
    await session.withTransaction(async () => {
      let prefix = req.body.generalInfo.trackingNumber.substring(0, 3);
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
        await createHistoryHelper(req.userData.uid, req.userData.orgId, "Update", req.body.generalInfo.trackingNumber, session);
      } else {
        await createHistoryHelper(req.userData.uid, req.userData.orgId, "Create", req.body.generalInfo.trackingNumber, session);
      }

      console.log(`createTracking: Tracking created successfully: ${createdTracking.trackingNumber}`);
      return res.status(201).json({message: "Tracking created successfully", tracking: createdTracking});
    });
    session.endSession();
  } catch (error) {
    console.error(`createTracking: ${req.body.generalInfo.trackingNumber}: ${error}`);
    console.error(`createTracking: ${req.body.generalInfo.trackingNumber}: ${JSON.stringify(error, null, 2)}`);
    if (error.message.includes("`carrierTrackingNumber` to be unique")) {
      return res.status(500).json({message: `Carrier tracking number ${req.body.carrierTrackingNumber} already existed`});
    }
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

  let createdTracking = null;
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

    if (req.body.generalInfo.trackingNumber.includes(TrackingTypes.ONLINE) || req.body.generalInfo.trackingNumber.includes(TrackingTypes.SERVICED)) {
      updateBody['itemsList'] = itemsListSetupHelper(req.body.itemsList)
    }

    if (type === TrackingTypes.INPERSON) {
      updateBody['subTrackings'] = subTrackingsSetupHelper(req);
    }

    if (type === TrackingTypes.CONSOLIDATED) {
      updateBody['onlineTrackings'] = req.body.onlineTrackings;
      updateBody['servicedTrackings'] = req.body.servicedTrackings;
      updateBody['inPersonTrackings'] = req.body.inPersonTrackings.map(i => i[0]);
    }

    if (type === TrackingTypes.MASTER) {
      updateBody['boxes'] = req.body.boxes;
    }

    generalInfo['filePaths'] = await updateImages(req, currentTracking.generalInfo.filePaths);
    updateBody['generalInfo'] = generalInfo;

    createdTracking = await MODEL.findByIdAndUpdate(req.body._id, updateBody, {new: true}).session(session).then(result => {return result});
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

    if (req.body.generalInfo.trackingNumber.includes(TrackingTypes.ONLINE)  || req.body.generalInfo.trackingNumber.includes(TrackingTypes.SERVICED)) {
      newBody['itemsList'] = itemsListSetupHelper(req.body.itemsList)
    }

    if (type === TrackingTypes.INPERSON) {
      newBody['subTrackings'] = subTrackingsSetupHelper(req);
    }

    if (type === TrackingTypes.CONSOLIDATED) {
      newBody['onlineTrackings'] = req.body.onlineTrackings;
      newBody['servicedTrackings'] = req.body.servicedTrackings;
      newBody['inPersonTrackings'] = req.body.inPersonTrackings.map(i => i[0]);
    }

    if (type === TrackingTypes.MASTER) {
      newBody['boxes'] = req.body.boxes;
    }

    generalInfo['filePaths'] = await addImages(req);
    newBody['generalInfo'] = generalInfo;

    tracking = new MODEL(newBody);
    createdTracking = await MODEL.create([tracking], {session: session}).then(createdTracking => {return createdTracking[0]});
  }

  assert (createdTracking != null, "CreatedTracking is null");

  if (type === TrackingTypes.CONSOLIDATED) {
    await changeStatusForConsolidatedHelper(req.userData.uid, req.userData.orgId, req.body.generalInfo.status, createdTracking._id, true, [req.body.onlineTrackings, req.body.servicedTrackings, req.body.inPersonTrackings], [req.body.removedOnlineTrackings, req.body.removedServicedTrackings, req.body.removedInPersonTrackings], session);
  }

  if (type === TrackingTypes.MASTER) {
    await changeStatusForMasterHelper(req.userData.uid, req.userData.orgId, req.body.generalInfo.status, createdTracking.trackingNumber, true, [req.body.validOnlineTrackingNumbers, req.body.validServicedTrackingNumbers, req.body.validInPersonTrackingNumbers], [req.body.removedOnlineTrackingNumbers, req.body.removedServicedTrackingNumbers, req.body.removedInPersonTrackingNumbers], createdTracking._id, session);
  }

  return createdTracking;
}


createHistoryHelper = async (userId, orgId, action, postId, session) => {
  return await HistoryModel.create([{
    userId: userId,
    action: action,
    postId: postId,
    organization: orgId
  }], {session: session});
}

generalInfoSetupHelper = async req => {
  return {
    sender: req.body.generalInfo.sender,
    recipient: req.body.generalInfo.recipient,
    organization: req.userData.orgId,
    content: req.body.content,
    status: req.body.generalInfo.status? req.body.generalInfo.status : "Created",
    active: req.body.generalInfo.active? req.body.generalInfo.active : true,
    paid: req.body.paid? req.body.paid : false,

    totalWeight: req.body.finalizedInfo? req.body.finalizedInfo.totalWeight : 0,
    finalCost: req.body.finalizedInfo? req.body.finalizedInfo.finalCost : 0,
    costAdjustment: req.body.finalizedInfo? req.body.finalizedInfo.costAdjustment : 0,
    exchange: req.body.finalizedInfo? req.body.finalizedInfo.exchange : 0,

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

itemsListSetupHelper = itemsList => {
  let results = [];
  itemsList.forEach(item =>{
    results.push({
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

  return results;
}

subTrackingsSetupHelper = req => {
  let subTrackings = [];
  req.body.subTrackings.forEach(sub =>{
    console.log(sub.linkedToCsl)
    subTrackings.push({
      trackingNumber: sub.trackingNumber,
      itemsList: itemsListSetupHelper(sub.itemsList),
      generalInfo: {
        totalWeight: sub.finalizedInfo.totalWeight,
        finalCost: sub.finalizedInfo.finalCost,
        costAdjustment: sub.finalizedInfo.costAdjustment,
        exchange: sub.finalizedInfo.exchange,
        paid: sub.paid,
        status: sub.status
      },
      linkedToCsl: sub.linkedToCslId,
      linkedToMst: sub.linkedToMst
    });
  });

  return subTrackings;
}

requestItemsSetupHelper = async req => {
  requestedItemsList = JSON.parse(req.body.requestedItems);

  requestedItems = []

  await requestedItemsList.forEach(item => {
    carrierTrackingIds = [];
    item.carrierTrackings.forEach(async item => {
      try {
        carrierTrackingIds.push((await CarrierTrackingController.getTrackerHelper(item.trackingNumber, item.carrier)).id);
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
  try {
    response = await getTrackingsHelper(req.query.type, req.userData.orgId, req.query);
    response.trackings = response.trackings.filter((doc) => {
      let result = false;

      result = result || doc.trackingNumber.match(new RegExp(req.query.searchTerm, 'i')) ||
            doc.generalInfo.status.match(new RegExp(req.query.searchTerm, 'i'))

      if (!result && req.query.type !== TrackingTypes.MASTER) { // Master doesn't have sender
        result = result || doc.generalInfo.sender.name.match(new RegExp(req.query.searchTerm, 'i'))
            || doc.generalInfo.sender.userCode.match(new RegExp(req.query.searchTerm, 'i'))
      }

      if (!result && req.query.type === TrackingTypes.ONLINE) {
        result = result || doc.carrierTracking.carrierTrackingNumber.match(new RegExp(req.query.searchTerm, 'i')) ||
        doc.carrierTracking.status.match(new RegExp(req.query.searchTerm, 'i')) ||
        doc.carrierTracking.carrier.match(new RegExp(req.query.searchTerm, 'i'))
      }

      if (!result && req.query.type === TrackingTypes.CONSOLIDATED) {
          doc.onlineTrackings.forEach(t => {if (t.trackingNumber.match(new RegExp(req.query.searchTerm, 'i'))) {result = true; return}});
          if (!result) doc.servicedTrackings.forEach(t => {if (t.trackingNumber.match(new RegExp(req.query.searchTerm, 'i'))) {result =  true; return}});
          if (!result) doc.inPersonTrackings.forEach(t => {if (t.trackingNumber.match(new RegExp(req.query.searchTerm, 'i'))) {result = true; return}});
      }

      if (!result && req.query.type === TrackingTypes.MASTER) {
        doc.boxes.forEach(b => {
          b.onlineTrackings.forEach(t => {if (t.trackingNumber.match(new RegExp(req.query.searchTerm, 'i'))) {result = true; return}});
          if (!result) b.servicedTrackings.forEach(t => {if (t.trackingNumber.match(new RegExp(req.query.searchTerm, 'i'))) {result =  true; return}});
          if (!result) b.inPersonTrackings.forEach(t => {if (t.trackingNumber.match(new RegExp(req.query.searchTerm, 'i'))) {result = true; return}});
        })
      }

      return result;
    });

    return res.status(200).json({
      trackings: response.trackings,
      count: response.trackings.length
    })
  } catch (error) {
    console.log("trackingFuzzySearch: " + error.message);
    return res.status(500).json({message: "Couldn't search for this term"});
  }
}

exports.getTrackings = async (req, res, next) => {
  try {
    let response = await getTrackingsHelper(req.query.type, req.userData.orgId, req.query);
    return res.status(200).json({
      // No error message needed
      trackings: response.trackings,
      count: response.count
    });
  } catch(error) {
    console.log("getTrackings: " + error.message);
    return res.status(500).json({message: "Couldn't fetch trackings"});
  };
}

getTrackingsHelper = async (type, orgId, query) => {
  assert(type != undefined, "Query type is undefined");
  assert(orgId != null, "orgId is null");

  queryBody = {
    'generalInfo.organization': orgId
  }

  if (query.origin) {
    queryBody['generalInfo.origin'] = query.origin;
  }

  if (query.destination) {
    queryBody['generalInfo.destination'] = query.destination;
  }

  if (query.sender) {
    queryBody['generalInfo.sender'] = query.sender;
  }

  let callbackfunction = async documents => {
    await populateSenderInfo(documents);
    await populateSubTrackings(documents);
    return {
      // No error message needed
      trackings: documents,
      count: totalCount
    }
  }

  let totalCount = 0;

  switch (type) {
    case TrackingTypes.ONLINE:
      let trackingQuery1 = OnlineTrackingModel.find(queryBody);
      totalCount = await OnlineTrackingModel.countDocuments().then(count => {return count});
      return await paginationHelper(+query.pageSize, +query.currentPage, trackingQuery1).populate("carrierTracking").populate('generalInfo.comments').populate('linkedToCsl').populate('linkedToMst').lean().exec().then(callbackfunction);
    case TrackingTypes.SERVICED:
      let trackingQuery2 = ServicedTrackingModel.find(queryBody);
      totalCount = await ServicedTrackingModel.countDocuments().then(count => {return count});
      return await paginationHelper(+query.pageSize, +query.currentPage, trackingQuery2).populate('generalInfo.comments').populate('linkedToCsl').populate('linkedToMst').lean().exec().then(callbackfunction);
    case TrackingTypes.INPERSON:
      let trackingQuery3 = InPersonTrackingModel.find(queryBody);
      totalCount = await InPersonTrackingModel.countDocuments().then(count => {return count});
      return await paginationHelper(+query.pageSize, +query.currentPage, trackingQuery3).populate('generalInfo.comments').populate('subTrackings.linkedToCsl').populate('subTrackings.linkedToMst').lean().exec().then(callbackfunction);
    case TrackingTypes.CONSOLIDATED:
      let trackingQuery4 = ConsolidatedTrackingModel.find(queryBody);
      totalCount = await ConsolidatedTrackingModel.countDocuments().then(count => {return count});
      return await paginationHelper(+query.pageSize, +query.currentPage, trackingQuery4).populate("onlineTrackings").populate("servicedTrackings").populate("inPersonTrackings").populate('generalInfo.comments').lean().exec().then(callbackfunction);
    case TrackingTypes.MASTER:
      let trackingQuery5 = MasterTrackingModel.find(queryBody);
      totalCount = await MasterTrackingModel.countDocuments().then(count => {return count});
      return await paginationHelper(+query.pageSize, +query.currentPage, trackingQuery5).populate("boxes.onlineTrackings").populate("boxes.servicedTrackings").populate("boxes.inPersonTrackings").populate('generalInfo.comments').lean().exec().then(callbackfunction);
    default:
      return {
        trackings: [],
        count: 0
      };
  }
}

populateSubTrackings = async (documents) => {
  for (d of documents) {
    if (d.trackingNumber.substring(0,3) === TrackingTypes.CONSOLIDATED) {
      let index = 0
      for (t of d.inPersonTrackings) {
        d.inPersonTrackings[index] = await getTrackingHelper(TrackingTypes.INPERSON, t._id, t.generalInfo.organization, true);
        index += 1;
      }
    }
  }
}

populateSenderInfo = async (documents) => {
  for (d of documents) {
    assert(d != null, "populateSenderInfo: Document is null");
    d.generalInfo.sender = await UserController.getUserByIdHelper(d.generalInfo.sender);
    if (d.trackingNumber.substring(0,3) === TrackingTypes.CONSOLIDATED) {
      for (t of d.onlineTrackings) {
        t.generalInfo.sender = await UserController.getUserByIdHelper(t.generalInfo.sender);
      }
      for (t of d.servicedTrackings) {
        t.generalInfo.sender = await UserController.getUserByIdHelper(t.generalInfo.sender);
      }
      for (t of d.inPersonTrackings) {
        t.generalInfo.sender = await UserController.getUserByIdHelper(t.generalInfo.sender);
      }
    }

    if (d.trackingNumber.substring(0,3) === TrackingTypes.MASTER) {
      for (b of d.boxes) {
        for (t of b.onlineTrackings) {
          t.generalInfo.sender = await UserController.getUserByIdHelper(t.generalInfo.sender);
        }
        for (t of b.servicedTrackings) {
          t.generalInfo.sender = await UserController.getUserByIdHelper(t.generalInfo.sender);
        }
        for (t of b.inPersonTrackings) {
          t.generalInfo.sender = await UserController.getUserByIdHelper(t.generalInfo.sender);
        }
      }
    }
  }
}

paginationHelper = (pageSize, currentPage, trackingQuery) => {
  // Pagination
  if (pageSize && currentPage) {
    trackingQuery
      .skip(pageSize * (currentPage - 1))
      .limit(pageSize);
  }
  return trackingQuery.sort({createdAt: -1});
}

exports.getTracking = async (req, res, next) => {
  try {
    let tracking = await getTrackingHelper(req.params.id.substring(0, 3), req.params.id, req.userData.orgId, false);
    assert(tracking != null);
    return res.status(200).json(tracking);

  } catch(error) {
    console.log(`getTracking: ${req.params.id} ${error.message}`);
    return res.status(500).json({message: "Couldn't fetch tracking"});
  };
}

getTrackingHelper = async (type, id, orgId, byId) => {

  let queryParams = {
    'generalInfo.organization': orgId
  };

  if (byId) {
    queryParams['_id'] = id;
  } else {
    queryParams['trackingNumber'] = id;
  }

  let callbackfunction = async document => {
    await populateSenderInfo([document]);
    await populateSubTrackings([document]);
    return document;
  }

  let tracking = null;
  switch(type) {
    case TrackingTypes.ONLINE:
      return await OnlineTrackingModel.findOne(queryParams).populate('carrierTracking').populate('linkedToCsl').populate('linkedToMst').lean()
        .then(callbackfunction);
    case TrackingTypes.SERVICED:
      break;
    case TrackingTypes.INPERSON:
      return await InPersonTrackingModel.findOne(queryParams).populate('subTrackings.linkedToCsl').populate('subTrackings.linkedToMst').populate('linkedToMst').lean()
        .then(callbackfunction);
    case TrackingTypes.CONSOLIDATED:
      return await ConsolidatedTrackingModel.findOne(queryParams)
      .populate('onlineTrackings')
      .populate('servicedTrackings')
      .populate('inPersonTrackings')
      .lean()
        .then(callbackfunction);
    case TrackingTypes.MASTER:
      return await MasterTrackingModel.findOne(queryParams)
      .populate('boxes.onlineTrackings')
      .populate('boxes.servicedTrackings')
      .populate('boxes.inPersonTrackings')
      .lean()
        .then(callbackfunction);
    default:
      return tracking;
  }
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

exports.changeTrackingStatus = async (req, res , next) => {
  try {
    let type = req.body.trackingNumber.substring(0, 3)
    session = await db.startSession();
    await session.withTransaction(async () => {
      if (type === TrackingTypes.MASTER) {
        await changeStatusForMasterHelper(req.userData.uid, req.userData.orgId, req.body.status, req.body.trackingNumber, false, null, null, session)
      } else if (type === TrackingTypes.CONSOLIDATED) {
        await changeStatusForConsolidatedHelper(req.userData.uid, req.userData.orgId, req.body.status, req.body.trackingNumber, false, null, null, session);
      } else {
        await changeTrackingStatusHelper(req.userData.uid, req.userData.orgId, type, req.body.status, [req.body.trackingNumber], false, session);
      }
    });
    session.endSession();
    tracking = await getTrackingHelper(type, req.body.trackingNumber, req.userData.orgId, false);

    // Open another session to flush
    if ([TrackingTypes.ONLINE, TrackingTypes.SERVICED, TrackingTypes.INPERSON].includes(req.body.trackingNumber.substring(0, 3))) {
      session = await db.startSession();
      let consolidatedTracking = await getTrackingHelper(TrackingTypes.CONSOLIDATED, tracking.linkedToCsl, req.userData.orgId, true);
      await populateStatusUpstreamForConsolidatedHelper(req.userData.uid, req.userData.orgId, [consolidatedTracking.onlineTrackings, consolidatedTracking.servicedTrackings, consolidatedTracking.inPersonTrackings], consolidatedTracking._id, session);
      session.endSession();
    }

    return res.status(200).json({message: "Status changed successfully", tracking: tracking});
  } catch (error) {
    console.log(`changeTrackingStatus: ${error}`);
    return res.status(500).json({message: "Status change failed"});
  }
}

changeStatusForMasterHelper = async (userId, orgId, status, masterTrackingNumber, edit, validTrackingNumbers, removedTrackingNumbers, toTrackingId, session) => { // When turning the switches
  if (edit) {
    status = status === trackingStatuses.Created ? trackingStatuses.ReadyToFly : status;

    await changeStatusForOnlineServicedInPersonHelper(userId, orgId, [status, status, status], validTrackingNumbers, false, session);
    await linkUnlinkForOnlineServicedInPersonHelper(userId, orgId, validTrackingNumbers, toTrackingId, TrackingTypes.MASTER, false, session);

    await changeStatusForOnlineServicedInPersonHelper(userId, orgId, [trackingStatuses.ReceivedAtOrigin, trackingStatuses.Created, trackingStatuses.Created], removedTrackingNumbers, false, session);
    await linkUnlinkForOnlineServicedInPersonHelper(userId, orgId, removedTrackingNumbers, toTrackingId, TrackingTypes.MASTER, false, session);

  } else {
    let statuses = [status, status, status];
    let masterTracking = await getTrackingHelper(TrackingTypes.MASTER, masterTrackingNumber, orgId, false);
    for (b of masterTracking.boxes) {
      await changeStatusForOnlineServicedInPersonHelper(userId, orgId, statuses, [b.onlineTrackings.map(t => t._id), b.servicedTrackings.map(t => t._id), b.inPersonTrackings.map(t => t._id)], true, session);
    }
    status = status === trackingStatuses.ReadyToFly ? trackingStatuses.Created : status;
    await changeTrackingStatusHelper(userId, orgId, TrackingTypes.MASTER, status, [masterTrackingNumber], false, session)
    return await getTrackingHelper(TrackingTypes.MASTER, masterTrackingNumber, orgId, false);
  }
}

/**
 * Just a helper for other methods, or when switches of consolidated trackings are switched
 * consolidatedTrackings: A list of consolidated tracking numbers
 */
changeStatusForConsolidatedHelper = async (userId, orgId, status, consolidatedTrackingIdNumber, edit, validTrackingIds, removedTrackingNumbers, session) => {
  if (edit) {
    await linkUnlinkForOnlineServicedInPersonHelper(userId, orgId, validTrackingIds, consolidatedTrackingIdNumber, TrackingTypes.CONSOLIDATED, true, session); // Link
    await linkUnlinkForOnlineServicedInPersonHelper(userId, orgId, removedTrackingNumbers, null, TrackingTypes.CONSOLIDATED, false, session); // Unlink

    // Change status for parent
    // await populateStatusUpstreamForConsolidatedHelper(userId, orgId, validTrackingIds, consolidatedTrackingIdNumber, session);

  } else {
    let consolidatedTracking = await getTrackingHelper(TrackingTypes.CONSOLIDATED, consolidatedTrackingIdNumber, orgId, false);
    if (Object.values(financialStatuses).includes(status)) {
      await changeTrackingStatusHelper(userId, orgId, TrackingTypes.CONSOLIDATED, status, [consolidatedTrackingIdNumber], false, session);
    }

    await changeTrackingStatusHelper(userId, orgId, TrackingTypes.ONLINE, status, consolidatedTracking.onlineTrackings.map(o => o._id), true, session);
    await changeTrackingStatusHelper(userId, orgId, TrackingTypes.SERVICED, status, consolidatedTracking.servicedTrackings.map(o => o._id), true, session);
    await changeTrackingStatusHelper(userId, orgId, TrackingTypes.INPERSON, status, consolidatedTracking.inPersonTrackings.map(o => o._id), true, session);
  }
}

populateStatusUpstreamForConsolidatedHelper = async (userId, orgId, validTrackingIds, consolidatedTrackingId, session) => {
  let onlineTrackings = await OnlineTrackingModel.find({_id: {$in: validTrackingIds[0]}}).lean().then(trackings => {return trackings});
  let servicedTrackings = await ServicedTrackingModel.find({_id: {$in: validTrackingIds[1]}}).lean().then(trackings => {return trackings});
  let inPersonTrackings = await InPersonTrackingModel.find({_id: {$in: validTrackingIds[2].map(t => t[0])}}).lean().then(trackings => {return trackings});
  let statuses = [...onlineTrackings.map(t => t.generalInfo.paid), ...servicedTrackings.map(t => t.generalInfo.paid), ...inPersonTrackings.map(t => t.generalInfo.paid)];
  let status = statuses.length == 0? financialStatuses.Unpaid : (allEqual(statuses) ? (statuses[0] == true? financialStatuses.Paid: financialStatuses.Unpaid) : financialStatuses.PartiallyPaid);
  await changeTrackingStatusHelper(userId, orgId, TrackingTypes.CONSOLIDATED, status, [consolidatedTrackingId], true, session);
}

changeStatusForOnlineServicedInPersonHelper = async (userId, orgId, statuses, trackings, byIds, session) => {
  await changeTrackingStatusHelper(userId, orgId, TrackingTypes.ONLINE, statuses[0], trackings[0], byIds, session);
  await changeTrackingStatusHelper(userId, orgId, TrackingTypes.SERVICED, statuses[1], trackings[1], byIds, session);
  await changeTrackingStatusHelper(userId, orgId, TrackingTypes.INPERSON, statuses[2], trackings[2], byIds, session);
}

linkUnlinkForOnlineServicedInPersonHelper = async (userId, orgId, trackings, toTrackingId, toTrackingType, byIds, session) => {
  await linkUnlinkTrackingHelper(userId, orgId, TrackingTypes.ONLINE, trackings[0], toTrackingId, toTrackingType, byIds, session);
  await linkUnlinkTrackingHelper(userId, orgId, TrackingTypes.SERVICED, trackings[1], toTrackingId, toTrackingType, byIds, session);
  await linkUnlinkTrackingHelper(userId, orgId, TrackingTypes.INPERSON, trackings[2], toTrackingId, toTrackingType, byIds, session);
}

linkUnlinkTrackingHelper = async (userId, orgId, type, itemsList, toTrackingId, toTrackingType, byIds, session) => {
  if (itemsList.length == 0) {
    return;
  }

  setParams = toTrackingType === TrackingTypes.CONSOLIDATED? {"linkedToCsl": toTrackingId} : toTrackingType === TrackingTypes.MASTER? {"linkedToMst": toTrackingId} : null;
  let queryParams = byIds? {"_id": {$in: itemsList}} : {"trackingNumber": {$in: itemsList}};

  if (type === TrackingTypes.INPERSON) {
    for (i of itemsList) {
      let query = null;
      if (byIds) {
        query = InPersonTrackingModel.findById(i[0]);
      } else {
        query = InPersonTrackingModel.findOne({trackingNumber: i[0]});
      }

      await query.then(async t => {
        assert(t != null, "linkUnlinkTrackingHelper: Found tracking is null");
        for (s of t.subTrackings) {
          if (i[1].includes(s._id.toString()) || i[1].includes(s.trackingNumber)) {
            if (toTrackingType === TrackingTypes.CONSOLIDATED) {
              s.linkedToCsl = toTrackingId;
            } else if (toTrackingType === TrackingTypes.MASTER) {
              s.linkedToMst = toTrackingId;
            }
          }
        };
        if (byIds) {
          await InPersonTrackingModel.findByIdAndUpdate(i[0], t).session(session);
        } else {
          await InPersonTrackingModel.updateOne({'trackingNumber': i[0]}, t).session(session);
        }
      });
    };
  } else {
    if (setParams) {
      await updateManyGeneralHelper(type, queryParams, setParams, session);
    }
  }

  let action = toTrackingId? "Link": "Unlink";
  await createHistoryHelper(userId, orgId, `${action} -> ${toTrackingId}`, itemsList.toString(), session);
  console.log(`linkUnlinkTracking: User id ${userId} ${action} ${itemsList.toString()} -> ${toTrackingType}: ${toTrackingId} `)
}

changeTrackingStatusHelper = async (userId, orgId, type, status, itemsList, byIds, session) => {
  if (![...Object.values(trackingStatuses), ...Object.values(financialStatuses)].includes(status) || itemsList.length == 0) {
    return;
  }

  let queryParams = byIds? {"_id": {$in: itemsList}} : {"trackingNumber": {$in: itemsList}};

  let setParams = {};

  if (status == financialStatuses.Paid) {
    setParams["generalInfo.paid"] = true;
    if (type == TrackingTypes.CONSOLIDATED) {
      setParams["generalInfo.status"] = status;
    }
  } else if (status == financialStatuses.Unpaid) {
    setParams["generalInfo.paid"] = false;
    if (type == TrackingTypes.CONSOLIDATED) {
      setParams["generalInfo.status"] = financialStatuses.Unpaid;
    }
  } else {
    setParams["generalInfo.status"] = status;
  }

  await updateManyGeneralHelper(type, queryParams, setParams, session);
  await createHistoryHelper(userId, orgId, `Updated status to ${status}`, itemsList.toString(), session);
  console.log(`changeTrackingStatus: User id ${userId} updated ${itemsList.toString()} -> ${status}`)

}

updateManyGeneralHelper = async (type, queryParams, setParams, session) => {
  switch (type) {
    case TrackingTypes.ONLINE:
      await OnlineTrackingModel.updateMany(queryParams, {$set: setParams}).session(session).then();
      break;
    case TrackingTypes.SERVICED:
      await ServicedTrackingModel.updateMany(queryParams, {$set: setParams}).session(session).then();
      break;
    case TrackingTypes.INPERSON:
      await InPersonTrackingModel.updateMany(queryParams, {$set: setParams}).session(session).then();
      break;
    case TrackingTypes.CONSOLIDATED:
      await ConsolidatedTrackingModel.updateMany(queryParams, {$set: setParams}).session(session).then();
      break;
    case TrackingTypes.MASTER:
      await MasterTrackingModel.updateMany(queryParams, {$set: setParams}).session(session).then();
      break;
    default:
      return;
  }
}

