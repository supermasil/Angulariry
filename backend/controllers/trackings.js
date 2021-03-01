const OnlineTrackingModel = require('../models/tracking-models/online-tracking');
const ServicedTrackingModel = require('../models/tracking-models/serviced-tracking');
const InPersonTrackingModel = require('../models/tracking-models/in-person-tracking');
const InPersonSubTrackingModel = require('../models/tracking-models/in-person-tracking-sub');
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
  INPERSONSUB: "inpsub",
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
exports.createUpdateTracking = async (req, res, next) => {
  // console.log(JSON.stringify(req.body, null, 2));
  try {
    const session = await db.startSession();
    let createdTracking = null;
    let type = req.body.generalInfo.trackingNumber.substring(0, 3);
    await session.withTransaction(async () => {
      switch (type) {
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
      console.log(`createTracking: Tracking created/updated successfully: ${createdTracking.trackingNumber}`);
      return res.status(201).json({message: "Tracking created/updated successfully", tracking: createdTracking});
    });
    session.endSession();
  } catch (error) {
    console.error(`createUpdateTracking: ${req.body.generalInfo.trackingNumber}: ${error}`);
    console.error(`createUpdateTracking: ${req.body.generalInfo.trackingNumber}: ${JSON.stringify(error, null, 2)}`);
    if (error.message.includes("`carrierTrackingNumber` to be unique")) {
      return res.status(500).json({message: `Carrier tracking number ${req.body.carrierTrackingNumber} already existed`});
    }
    return res.status(500).json({message: `Tracking creation/update failed, please check your info or contact Admin with tracking number ${req.body.generalInfo.trackingNumber}. If this is an online order, check if your carrier/ carrier tracking number is correct`});
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
  let updateBody = {}

  if (req.body._id) { //edit case
    let currentTracking = await MODEL.findById(req.body._id).then(result => result);
    if (type === TrackingTypes.ONLINE) {
      let currentCarrierTracking = await CarrierTrackingController.getCarrierTracking(currentTracking.carrierTracking);
      assert(currentCarrierTracking != null, "Carrier tracking number is null");
      if (currentCarrierTracking.carrier != req.body.carrier || currentCarrierTracking.carrierTrackingNumber != req.body.carrierTrackingNumber) {
        await CarrierTrackingController.updateCarrierTracking(currentTracking.carrierTracking, req.body.carrierTrackingNumber, tracker.status, tracker.id, req.body.carrier, session);
      }
      updateBody['received'] = req.body.received;
    }
    generalInfo['filePaths'] = await updateImages(req, currentTracking.generalInfo.filePaths);
  } else { // create case
    updateBody['trackingNumber'] = req.body.generalInfo.trackingNumber;
    if (type === TrackingTypes.ONLINE) {
      let newcarrierTracking = await CarrierTrackingController.createCarrierTracking(req.body.carrierTrackingNumber, tracker.status, tracker.id, req.body.carrier, req.body.generalInfo.trackingNumber, session);
      updateBody['carrierTracking'] = newcarrierTracking._id,
      updateBody['received'] = req.body.received
    }
    generalInfo['filePaths'] = await addImages(req);
  }

  updateBody['generalInfo'] = generalInfo;
  let subtrackings = [];

  switch (type) {
    case TrackingTypes.ONLINE:
      updateBody['itemsList'] = itemsListSetupHelper(req.body.itemsList);
      break;
    case TrackingTypes.SERVICED:
      break;
    case TrackingTypes.INPERSON:
      subtrackings = await subTrackingsSetupHelper(req, session);
      updateBody['subTrackings'] = subtrackings.map(t => t._id);
      break;
    case TrackingTypes.CONSOLIDATED:
      updateBody['onlineTrackings'] = req.body.onlineTrackingIds;
      updateBody['servicedTrackings'] = req.body.servicedTrackingIds;
      updateBody['inPersonSubTrackings'] = req.body.inPersonSubTrackingIds;
      break;
    case TrackingTypes.MASTER:
      updateBody['boxes'] = req.body.boxes;
      break;
    default:
      throw new Error("createUpdateTrackingHelper: Tracking type doesn't match any");
  }

  if (req.body._id) { //edit case
    createdTracking = await MODEL.findByIdAndUpdate(req.body._id, updateBody, {new: true}).session(session).then(result => {return result});
  } else {
    tracking = new MODEL(updateBody);
    createdTracking = await MODEL.create([tracking], {session: session}).then(createdTracking => {return createdTracking[0]});
  }

  assert (createdTracking != null, "CreatedTracking is null");

  switch (type) {
    case TrackingTypes.CONSOLIDATED:
      await changeStatusForConsolidatedHelper(req.userData.uid, req.userData.orgId, createdTracking._id, [req.body.onlineTrackingIds, req.body.servicedTrackingIds, req.body.inPersonSubTrackingIds], [req.body.removedOnlineTrackingIds, req.body.removedServicedTrackingIds, req.body.removedInPersonSubTrackingIds], true, session);
      break;
    case TrackingTypes.MASTER:
      await changeStatusForMasterHelper(req.userData.uid, req.userData.orgId, req.body.generalInfo.trackingStatus, createdTracking._id, true, [req.body.validOnlineTrackingIds, req.body.validServicedTrackingIds, req.body.validInPersonSubTrackingIds], [req.body.removedOnlineTrackingIds, req.body.removedServicedTrackingIds, req.body.removedInPersonSubTrackingIds], session);
      break;
    case TrackingTypes.INPERSON:
      for (id of req.body.removedTrackingIds) {
        await InPersonSubTrackingModel.findByIdAndDelete(id).session(session);
      }
      await populateStatusUpstreamHelper(req.userData.uid, req.userData.orgId, [[],[],createdTracking.subTrackings], subtrackings, createdTracking._id, TrackingTypes.INPERSON, true, session);
      break;
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
    trackingStatus: req.body.generalInfo.trackingStatus? req.body.generalInfo.trackingStatus : trackingStatuses.Created,
    financialStatus: req.body.generalInfo.financialStatus? req.body.generalInfo.financialStatus : financialStatuses.Unpaid,
    active: req.body.generalInfo.active? req.body.generalInfo.active : true,
    type: req.body.generalInfo.trackingNumber.substring(0,3),

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

subTrackingsSetupHelper = async (req, session) => {
  let subTrackings = [];

  for (sub of req.body.subTrackings) {
      let generalInfo = await generalInfoSetupHelper(req);
      generalInfo.totalWeight = sub.finalizedInfo.totalWeight;
      generalInfo.finalCost = sub.finalizedInfo.finalCost;
      generalInfo.costAdjustment = sub.finalizedInfo.costAdjustment;
      generalInfo.exchange = sub.finalizedInfo.exchange;
      generalInfo.trackingStatus = sub.trackingStatus;
      generalInfo.financialStatus = sub.financialStatus == true ? financialStatuses.Paid : financialStatuses.Unpaid;
      generalInfo.type = TrackingTypes.INPERSONSUB;

      data = {
        trackingNumber: sub.trackingNumber,
        itemsList: itemsListSetupHelper(sub.itemsList),
        generalInfo: generalInfo,
        linkedToCsl: sub.linkedToCslId,
        linkedToMst: sub.linkedToMstId,
      }
      let createdTracking = null;
      if (sub._id) { // old ones
        createdTracking = await InPersonSubTrackingModel.findByIdAndUpdate(sub._id, data, {new: true}).session(session).then(result => {return result});
      } else {
        createdTracking = await InPersonSubTrackingModel
          .create([data], {session: session})
          .then(createdTracking => {return createdTracking[0]});
      }
      assert(createdTracking != null, "subTrackingsSetupHelper: createdTracking is null");
      subTrackings.push(createdTracking);
  };
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
            doc.generalInfo.trackingStatus.match(new RegExp(req.query.searchTerm, 'i'))

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
          if (!result) doc.inPersonSubTrackings.forEach(t => {if (t.trackingNumber.match(new RegExp(req.query.searchTerm, 'i'))) {result = true; return}});
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
    await populateSenderInfo(documents, type);
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
      return await paginationHelper(+query.pageSize, +query.currentPage, trackingQuery1)
        .populate("carrierTracking")
        .populate('generalInfo.comments')
        .populate('linkedToCsl')
        .populate('linkedToMst')
        .lean().exec().then(callbackfunction);
    case TrackingTypes.SERVICED:
      return {
        trackings: [],
        count: 0
      };
    case TrackingTypes.INPERSON:
      let trackingQuery3 = InPersonTrackingModel.find(queryBody);
      totalCount = await InPersonTrackingModel.countDocuments().then(count => {return count});
      return await paginationHelper(+query.pageSize, +query.currentPage, trackingQuery3)
        .populate('generalInfo.comments')
        .populate({path: 'subTrackings', populate: {path: 'linkedToCsl'}})
        .populate({path: 'subTrackings', populate: {path: 'linkedToMst'}})
        .lean().exec().then(callbackfunction);
    case TrackingTypes.INPERSONSUB:
      let trackingQuery4 = InPersonSubTrackingModel.find(queryBody);
      totalCount = await InPersonSubTrackingModel.countDocuments().then(count => {return count});
      return await paginationHelper(+query.pageSize, +query.currentPage, trackingQuery4)
        .populate('generalInfo.comments')
        .populate('linkedToCsl')
        .populate('linkedToMst')
        .lean().exec().then(callbackfunction);
    case TrackingTypes.CONSOLIDATED:
      let trackingQuery5 = ConsolidatedTrackingModel.find(queryBody);
      totalCount = await ConsolidatedTrackingModel.countDocuments().then(count => {return count});
      return await paginationHelper(+query.pageSize, +query.currentPage, trackingQuery5)
        .populate('generalInfo.comments')
        .populate('onlineTrackings')
        .populate("servicedTrackings")
        .populate("inPersonSubTrackings")
        .lean().exec().then(callbackfunction);
    case TrackingTypes.MASTER:
      let trackingQuery6 = MasterTrackingModel.find(queryBody);
      totalCount = await MasterTrackingModel.countDocuments().then(count => {return count});
      return await paginationHelper(+query.pageSize, +query.currentPage, trackingQuery6)
        .populate("generalInfo.comments")
        .populate("boxes.onlineTrackings")
        .populate("boxes.servicedTrackings")
        .populate("boxes.inPersonSubTrackings")
        .lean().exec().then(callbackfunction);
    default:
      throw new Error("getTrackingsHelper: Tracking type doesn't match any");
  }
}

exports.getTracking = async (req, res, next) => {
  try {
    let tracking = await getTrackingHelper(req.query.type, req.params.id, req.userData.orgId, false);
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
    await populateSenderInfo([document], type);
    return document;
  }

  switch(type) {
    case TrackingTypes.ONLINE:
      return await OnlineTrackingModel.findOne(queryParams)
        .populate('carrierTracking')
        .populate('linkedToCsl')
        .populate('linkedToMst')
        .lean().then(callbackfunction);
    case TrackingTypes.SERVICED:
      return;
    case TrackingTypes.INPERSON:
      return await InPersonTrackingModel.findOne(queryParams)
        .populate('subTrackings')
        .populate({path: 'subTrackings', populate: {path: 'linkedToCsl'}})
        .populate({path: 'subTrackings', populate: {path: 'linkedToMst'}})
        .lean().then(callbackfunction);
    case TrackingTypes.INPERSONSUB:
      return await InPersonSubTrackingModel.findOne(queryParams)
        .populate('linkedToCsl')
        .populate('linkedToMst')
        .lean().then(callbackfunction);
    case TrackingTypes.CONSOLIDATED:
      return await ConsolidatedTrackingModel.findOne(queryParams)
        .populate('onlineTrackings')
        .populate('servicedTrackings')
        .populate('inPersonSubTrackings')
        .lean().then(callbackfunction);
    case TrackingTypes.MASTER:
      return await MasterTrackingModel.findOne(queryParams)
        .populate('boxes.onlineTrackings')
        .populate('boxes.servicedTrackings')
        .populate('boxes.inPersonSubTrackings')
        .lean().then(callbackfunction);
    default:
      throw new Error("getTrackingHelper: Tracking type doesn't match any");
  }
}

populateSenderInfo = async (documents, type) => {
  for (d of documents) {
    assert(d != null, "populateSenderInfo: Document is null");
    let sender = await UserController.getUserByIdHelper(d.generalInfo.sender);
    d.generalInfo.sender = sender;

    switch (type) {
      case TrackingTypes.INPERSON:
        for (s of d.subTrackings) {
          s.generalInfo.sender = sender;
        }
        break;
      case TrackingTypes.CONSOLIDATED:
        await populateSenderInfoHelper(d, sender);
        break;
      case TrackingTypes.MASTER:
        for (b of d.boxes) {
          await populateSenderInfoHelper(b, sender);
        }
        break;
    }
  }
}

populateSenderInfoHelper = async (document, sender) => {
  if (!document) { return; }

  if (document.onlineTrackings) {
    for (t of document.onlineTrackings) {
      t.generalInfo.sender = sender
    }
  }
  if (document.servicedTrackings) {
    for (t of document.servicedTrackings) {
      t.generalInfo.sender = sender
    }
  }
  if (document.inPersonSubTrackings) {
    for (t of document.inPersonSubTrackings) {
      t.generalInfo.sender = sender;
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
    let type = req.body.type;
    let _id = req.body._id;
    let tracking = null;

    session = await db.startSession();
    await session.withTransaction(async () => {
      switch(type) {
        case TrackingTypes.ONLINE:
          await changeTrackingStatusHelper(req.userData.uid, req.userData.orgId, type, req.body.status, [_id], true, session);
          break;
        case TrackingTypes.SERVICED:
          throw new Error(`changeTrackingStatus: Tracking type ${TrackingTypes.SERVICED} is not suppported`);
        case TrackingTypes.INPERSONSUB: // We only change status of inpersonsub
          await changeTrackingStatusHelper(req.userData.uid, req.userData.orgId, type, req.body.status, [_id], true, session);
          break;
        case TrackingTypes.CONSOLIDATED:
          throw new Error(`changeTrackingStatus: Tracking type ${TrackingTypes.CONSOLIDATED} is not suppported`);
        case TrackingTypes.MASTER:
          await changeStatusForMasterHelper(req.userData.uid, req.userData.orgId, req.body.status, _id, false, null, null, session);
          break;
        default:
          throw new Error("changeTrackingStatus: Tracking type doesn't match any");
      }
    });

    // To avoid having to open another transaction
    tracking = await getTrackingHelper(type, _id, req.userData.orgId, true);

    if (Object.values(financialStatuses).includes(req.body.status)) {
      tracking.generalInfo.financialStatus = req.body.status;
    } else if (Object.values(trackingStatuses).includes(req.body.status)) {
      if (type == TrackingTypes.MASTER && req.body.status == trackingStatuses.ReadyToFly) {
        tracking.generalInfo.trackingStatus = trackingStatuses.Created;
      } else {
        tracking.generalInfo.trackingStatus = req.body.status;
      }
    }

    assert (tracking != null, "changeTrackingStatus: Tracking is null");


    if (tracking.linkedToCsl) {
      await populateStatusUpstreamHelper(req.userData.uid, req.userData.orgId, null, [tracking], tracking.linkedToCsl._id, TrackingTypes.CONSOLIDATED, true, session);
    }
    if (tracking.linkedToMst) {
      await populateStatusUpstreamHelper(req.userData.uid, req.userData.orgId, null, [tracking], tracking.linkedToMst._id, TrackingTypes.MASTER, true, session);
    }

    if (TrackingTypes.INPERSONSUB == type) {
      await populateStatusUpstreamHelper(req.userData.uid, req.userData.orgId, null, [tracking], tracking.trackingNumber.substring(0, tracking.trackingNumber.lastIndexOf('-')), TrackingTypes.INPERSON, false, session);
    }


    session.endSession();

    return res.status(200).json({message: "Status changed successfully", tracking: tracking});
  } catch (error) {
    console.log(`changeTrackingStatus: ${error}`);
    return res.status(500).json({message: "Status change failed"});
  }
}

changeStatusForMasterHelper = async (userId, orgId, currentStatus, masterTrackingId, edit, validTrackingIds, removedTrackingIds, session) => { // When turning the switches

  let inPersonTrackingNumbers = [];
  validTrackings = [[],[],[]];
  removedTrackings = [[],[],[]];

  if (edit) {
    currentStatus = currentStatus === trackingStatuses.Created ? trackingStatuses.ReadyToFly : currentStatus;
    validTrackings[0] = await OnlineTrackingModel.find({_id: {$in: validTrackingIds[0]}}).lean().then(trackings => {return trackings});
    validTrackings[1] = await ServicedTrackingModel.find({_id: {$in: validTrackingIds[1]}}).lean().then(trackings => {return trackings});
    validTrackings[2] = await InPersonSubTrackingModel.find({_id: {$in: validTrackingIds[2]}}).lean().then(trackings => {return trackings});
    removedTrackings[0] = await OnlineTrackingModel.find({_id: {$in: removedTrackingIds[0]}}).lean().then(trackings => {return trackings});
    removedTrackings[1] = await ServicedTrackingModel.find({_id: {$in: removedTrackingIds[1]}}).lean().then(trackings => {return trackings});
    removedTrackings[2] = await InPersonSubTrackingModel.find({_id: {$in: removedTrackingIds[2]}}).lean().then(trackings => {return trackings});
    inPersonTrackingNumbers.push(...validTrackings[2].map(t => t.trackingNumber.substring(0, t.trackingNumber.lastIndexOf('-'))), ...removedTrackings[2].map(t => t.trackingNumber.substring(0, t.trackingNumber.lastIndexOf('-'))));
    await linkUnlinkForOnlineServicedInPersonHelper(userId, orgId, validTrackingIds, masterTrackingId, TrackingTypes.MASTER, true, session);
    await linkUnlinkForOnlineServicedInPersonHelper(userId, orgId, removedTrackingIds, null, TrackingTypes.MASTER, true, session);
  } else {
    let masterTracking = await getTrackingHelper(TrackingTypes.MASTER, masterTrackingId, orgId, true);
    validTrackingIds = [[],[],[]]
    for (b of masterTracking.boxes) {
      validTrackings[0].push(...b.onlineTrackings.map(t => t));
      validTrackings[1].push(...b.servicedTrackings.map(t => t));
      validTrackings[2].push(...b.inPersonSubTrackings.map(t => t));
      validTrackingIds[0].push(...b.onlineTrackings.map(t => t._id.toString()));
      validTrackingIds[1].push(...b.servicedTrackings.map(t => t._id.toString()));
      validTrackingIds[2].push(...b.inPersonSubTrackings.map(t => t._id.toString()));
      inPersonTrackingNumbers.push(...b.inPersonSubTrackings.map(t => t.trackingNumber.substring(0, t.trackingNumber.lastIndexOf('-'))));
    }
  }

  let combinedTrackings = [...validTrackings.flat(), ...removedTrackings.flat()];

  combinedTrackings.forEach(t => {
    if (validTrackingIds.flat().includes(t._id.toString())) {
      t.generalInfo.trackingStatus = currentStatus;
    } else if (removedTrackingIds && removedTrackingIds.flat().includes(t._id.toString())) {
      t.generalInfo.trackingStatus = t.type === TrackingTypes.ONLINE? trackingStatuses.ReceivedAtOrigin : trackingStatuses.Created;
    }
  });

  let cslIds = new Set(combinedTrackings.map(t => t.linkedToCsl).filter(t => t != null));
  inPersonTrackingNumbers =  new Set(inPersonTrackingNumbers);

  if (edit) {
    await changeStatusForOnlineServicedInPersonHelper(userId, orgId, [currentStatus, currentStatus, currentStatus], validTrackingIds, true, session);
    await changeStatusForOnlineServicedInPersonHelper(userId, orgId, [trackingStatuses.ReceivedAtOrigin, trackingStatuses.Created, trackingStatuses.Created], removedTrackingIds, true, session);
  } else {
    await changeStatusForOnlineServicedInPersonHelper(userId, orgId, [currentStatus, currentStatus, currentStatus], [validTrackingIds[0], validTrackingIds[1], validTrackingIds[2]], true, session);
  }

  for (t of inPersonTrackingNumbers) {
    await populateStatusUpstreamHelper(userId, orgId, null, combinedTrackings, t, TrackingTypes.INPERSON, false, session);
  };

  for (t of cslIds) {
    await populateStatusUpstreamHelper(userId, orgId, null, combinedTrackings, t, TrackingTypes.CONSOLIDATED, true, session);
  }

  await populateStatusUpstreamHelper(userId, orgId, validTrackingIds, [], masterTrackingId, TrackingTypes.MASTER, true, session); // Populate for financialStatus
  currentStatus = edit && (validTrackings.flat().length == 0 || currentStatus === trackingStatuses.ReadyToFly) ? trackingStatuses.Created : currentStatus;
  await changeTrackingStatusHelper(userId, orgId, TrackingTypes.MASTER, currentStatus, [masterTrackingId], true, session);

}


/**
 * Just a helper for other methods, or when switches of consolidated trackings are switched
 * consolidatedTrackings: A list of consolidated tracking numbers
 */
changeStatusForConsolidatedHelper = async (userId, orgId, consolidatedTrackingId, validTrackingIds, removedTrackingIds, edit, session) => {
  if (edit) {
    await linkUnlinkForOnlineServicedInPersonHelper(userId, orgId, validTrackingIds, consolidatedTrackingId, TrackingTypes.CONSOLIDATED, true, session); // Link
    await linkUnlinkForOnlineServicedInPersonHelper(userId, orgId, removedTrackingIds, null, TrackingTypes.CONSOLIDATED, true, session); // Unlink
    await populateStatusUpstreamHelper(userId, orgId, validTrackingIds, [], consolidatedTrackingId, TrackingTypes.CONSOLIDATED, true, session);
  }
}

// The purpose is to complete all the tracking changing in 1 transaction
substituteTrackingsInMemory = (trackings, substitutions) => {
  temp = [...trackings];
  trackings.forEach((t, i) => {
    let sub = substitutions.filter(s => s._id.toString() == t._id.toString());
    assert(sub.length <= 1, "substituteTrackingsInMemory: sub length > 1");
    if (sub.length == 1) {
      temp[i] = sub[0];
    }
  });
  return temp;
}

populateStatusUpstreamHelper = async (userId, orgId, validTrackingIds, currentTrackings, trackingId, type, byIds, session) => {
  let onlineTrackings = servicedTrackings = inPersonSubTrackings = [];

  if (validTrackingIds) {
    onlineTrackings = substituteTrackingsInMemory(await OnlineTrackingModel.find({_id: {$in: validTrackingIds[0]}}).lean().then(trackings => {return trackings}), currentTrackings);
    servicedTrackings = substituteTrackingsInMemory(await ServicedTrackingModel.find({_id: {$in: validTrackingIds[1]}}).lean().then(trackings => {return trackings}), currentTrackings);
    inPersonSubTrackings = substituteTrackingsInMemory(await InPersonSubTrackingModel.find({_id: {$in: validTrackingIds[2]}}).lean().then(trackings => {return trackings}), currentTrackings);
  } else if (type == TrackingTypes.CONSOLIDATED) {
    let tracking = await getTrackingHelper(TrackingTypes.CONSOLIDATED, trackingId, orgId, byIds);
    onlineTrackings = substituteTrackingsInMemory(tracking.onlineTrackings, currentTrackings);
    servicedTrackings = substituteTrackingsInMemory(tracking.servicedTrackings, currentTrackings);
    inPersonSubTrackings = substituteTrackingsInMemory(tracking.inPersonSubTrackings, currentTrackings);
  } else if (type == TrackingTypes.MASTER) {
    let tracking = await getTrackingHelper(TrackingTypes.MASTER, trackingId, orgId, byIds);
    tracking.boxes.forEach(b => {
      onlineTrackings.push(...substituteTrackingsInMemory(b.onlineTrackings, currentTrackings));
      servicedTrackings.push(...substituteTrackingsInMemory(b.servicedTrackings, currentTrackings));
      inPersonSubTrackings.push(...substituteTrackingsInMemory(b.inPersonSubTrackings, currentTrackings));
    });
  } else if (type == TrackingTypes.INPERSON) {
    console.log(trackingId);
    let tracking = await getTrackingHelper(TrackingTypes.INPERSON, trackingId, orgId, byIds);
    inPersonSubTrackings = substituteTrackingsInMemory(tracking.subTrackings, currentTrackings);
  }

  if (type == TrackingTypes.INPERSON && inPersonSubTrackings.length == 0 && currentTrackings.length > 0) { // Inperson create case
    inPersonSubTrackings = currentTrackings;
  }

  let tStatuses = [...onlineTrackings.map(t => t.generalInfo.trackingStatus), ...servicedTrackings.map(t => t.generalInfo.trackingStatus), ...inPersonSubTrackings.map(t => t.generalInfo.trackingStatus)];
  let tStatus = null;
  let fStatuses = [...onlineTrackings.map(t => t.generalInfo.financialStatus), ...servicedTrackings.map(t => t.generalInfo.financialStatus), ...inPersonSubTrackings.map(t => t.generalInfo.financialStatus)];
  let fStatus = fStatuses.length == 0? financialStatuses.Unpaid : allEqual(fStatuses) ? fStatuses[0] : financialStatuses.PartiallyPaid;

  minIndex = -1;
  if (tStatuses.length == 0) {
    tStatus = trackingStatuses.Created;
  } else if (allEqual(tStatuses)) {
    tStatus = tStatuses[0]
  } else {
    tStatuses.forEach((s) => {
      currIndex = Object.values(trackingStatuses).indexOf(s);
      minIndex = minIndex == -1? currIndex : currIndex < minIndex? currIndex: minIndex;
    });
    assert(minIndex >= 0, "populateStatusUpstreamHelper: minIndex is -1");
    tStatus = Object.values(trackingStatuses)[minIndex];
  }

  assert(tStatus != null, "populateStatusUpstreamHelper: tStatus is null");
  assert(fStatus != null, "populateStatusUpstreamHelper: fStatus is null");
  await changeTrackingStatusHelper(userId, orgId, type, tStatus, [trackingId], byIds, session);
  await changeTrackingStatusHelper(userId, orgId, type, fStatus, [trackingId], byIds, session);
}

linkUnlinkForOnlineServicedInPersonHelper = async (userId, orgId, trackings, toTrackingId, toTrackingType, byIds, session) => {
  await linkUnlinkTrackingHelper(userId, orgId, TrackingTypes.ONLINE, trackings[0], toTrackingId, toTrackingType, byIds, session);
  await linkUnlinkTrackingHelper(userId, orgId, TrackingTypes.SERVICED, trackings[1], toTrackingId, toTrackingType, byIds, session);
  await linkUnlinkTrackingHelper(userId, orgId, TrackingTypes.INPERSONSUB, trackings[2], toTrackingId, toTrackingType, byIds, session);
}

linkUnlinkTrackingHelper = async (userId, orgId, type, itemsList, toTrackingId, toTrackingType, byIds, session) => {
  if (itemsList.length == 0) {
    return;
  }

  let setParams = toTrackingType === TrackingTypes.CONSOLIDATED? {"linkedToCsl": toTrackingId} : toTrackingType === TrackingTypes.MASTER? {"linkedToMst": toTrackingId} : null;
  let queryParams = byIds? {"_id": {$in: itemsList}} : {"trackingNumber": {$in: itemsList}};
  await updateManyGeneralHelper(type, queryParams, setParams, session);

  let action = toTrackingId? "Link": "Unlink";
  await createHistoryHelper(userId, orgId, `${action} -> ${toTrackingId}`, itemsList.toString(), session);
  console.log(`linkUnlinkTracking: User id ${userId} ${action} ${itemsList.toString()} -> ${toTrackingType}: ${toTrackingId} `)
}

changeStatusForOnlineServicedInPersonHelper = async (userId, orgId, statuses, trackings, byIds, session) => {
  await changeTrackingStatusHelper(userId, orgId, TrackingTypes.ONLINE, statuses[0], trackings[0], byIds, session);
  await changeTrackingStatusHelper(userId, orgId, TrackingTypes.SERVICED, statuses[1], trackings[1], byIds, session);
  await changeTrackingStatusHelper(userId, orgId, TrackingTypes.INPERSONSUB, statuses[2], trackings[2], byIds, session);
}

changeTrackingStatusHelper = async (userId, orgId, type, status, itemsList, byIds, session) => {
  if (itemsList.length == 0) {
    return;
  }

  if (![...Object.values(trackingStatuses), ...Object.values(financialStatuses)].includes(status) || itemsList.length == 0) {
    return;
  }

  let queryParams = byIds? {"_id": {$in: itemsList}} : {"trackingNumber": {$in: itemsList}};
  let setParams = {};

  if (Object.values(financialStatuses).includes(status)) {
    setParams["generalInfo.financialStatus"] = status;
  } else if (Object.values(trackingStatuses).includes(status)) {
    setParams["generalInfo.trackingStatus"] = status;
  }

  await updateManyGeneralHelper(type, queryParams, setParams, session);
  await createHistoryHelper(userId, orgId, `Updated status to ${status}`, itemsList.toString(), session);
  console.log(`changeTrackingStatusHelper: User id ${userId} updated type: ${type} ${itemsList.toString()} -> ${status}`)
}

updateManyGeneralHelper = async (type, queryParams, setParams, session) => {
  let res = null;
  switch (type) {
    case TrackingTypes.ONLINE:
      res = await OnlineTrackingModel.updateMany(queryParams, {$set: setParams}).session(session).then();
      break;
    case TrackingTypes.SERVICED:
      res = await ServicedTrackingModel.updateMany(queryParams, {$set: setParams}).session(session).then();
      break;
    case TrackingTypes.INPERSONSUB:
      res = await InPersonSubTrackingModel.updateMany(queryParams, {$set: setParams}).session(session).then();
      break;
      case TrackingTypes.INPERSON: // It's actually sub tracking
      res = await InPersonTrackingModel.updateMany(queryParams, {$set: setParams}).session(session).then();
      break;
    case TrackingTypes.CONSOLIDATED:
      res = await ConsolidatedTrackingModel.updateMany(queryParams, {$set: setParams}).session(session).then();
      break;
    case TrackingTypes.MASTER:
      res = await MasterTrackingModel.updateMany(queryParams, {$set: setParams}).session(session).then();
      break;
    default:
      throw new Error("updateManyGeneralHelper: Tracking type doesn't match any");
  }

  if (!res || res.nModified == 0) {
    throw new Error(`updateManyGeneralHelper: Nothing got modified ${queryParams} ${setParams}`)
  }
}

