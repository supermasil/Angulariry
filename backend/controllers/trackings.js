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

const TrackingTypes = Object.freeze({
  ONLINE: "onl",
  SERVICED: "sev",
  INPERSON: "inp",
  CONSOLIDATED: "csl",
  MASTER: "mst",
});

const allStatusTypes= {
  Unknown: "Unknown",
  Created: "Created",
  Pending: "Pending",
  BeingShippedToOrigin: "Being shipped to origin",
  ReceivedAtOrigin: "Received at origin",
  Consolidated: "Consolidated",
  ReadyToFly: "Ready to fly",
  Flying: "Flying",
  ReceivedAtDestination: "Received at destination",
  BeingDeliveredToRecipient: "Being delivered to recipient",
  DeliveredToRecipient: "Delivered to recipient",
}

const postReceivedAtDestinationStatuses = Object.values(allStatusTypes).slice(8);

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
        await createHistoryHelper(req.userData.uid, "Update", req.body.generalInfo.trackingNumber, session);
      } else {
        await createHistoryHelper(req.userData.uid, "Create", req.body.generalInfo.trackingNumber, session);
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

    if (req.body.generalInfo.trackingNumber.includes(TrackingTypes.ONLINE) || req.body.generalInfo.trackingNumber.includes(TrackingTypes.INPERSON) || req.body.generalInfo.trackingNumber.includes(TrackingTypes.ONLINE)) {
      updateBody['itemsList'] = itemsListSetupHelper(req)
    }

    if (type === TrackingTypes.CONSOLIDATED) {
      updateBody['onlineTrackings'] = req.body.onlineTrackings;
      updateBody['servicedTrackings'] = req.body.servicedTrackings;
      updateBody['inPersonTrackings'] = req.body.inPersonTrackings;
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

    if (req.body.generalInfo.trackingNumber.includes(TrackingTypes.ONLINE) || req.body.generalInfo.trackingNumber.includes(TrackingTypes.INPERSON) || req.body.generalInfo.trackingNumber.includes(TrackingTypes.ONLINE)) {
      newBody['itemsList'] = itemsListSetupHelper(req)
    }

    if (type === TrackingTypes.CONSOLIDATED) {
      newBody['onlineTrackings'] = req.body.onlineTrackings;
      newBody['servicedTrackings'] = req.body.servicedTrackings;
      newBody['inPersonTrackings'] = req.body.inPersonTrackings;
    }

    if (type === TrackingTypes.MASTER) {
      newBody['boxes'] = req.body.boxes;
    }

    generalInfo['filePaths'] = await addImages(req);
    newBody['generalInfo'] = generalInfo;

    tracking = new MODEL(newBody);

    await tracking.validate();
    createdTracking = await MODEL.create([tracking], {session: session}).then(createdTracking => {return createdTracking[0]});
  }

  assert (createdTracking != null, "CreatedTracking is null");

  if (type === TrackingTypes.CONSOLIDATED) {
    await changeStatusForConsolidatedHelper(req.userData.uid, req.userData.orgId, req.body.generalInfo.status, null, true, [req.body.onlineTrackings, req.body.servicedTrackings, req.body.inPersonTrackings], [req.body.removedOnlineTrackings, req.body.removedServicedTrackings, req.body.removedInPersonTrackings], createdTracking._id, session);
  }

  if (type === TrackingTypes.MASTER) {
    await changeStatusForMasterHelper(req.userData.uid, req.userData.orgId, req.body.generalInfo.status, createdTracking._id, true, req.body.validTrackingNumbers, req.body.removedConsolidatedTrackingNumbers, session)
  }

  return createdTracking;
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
    exchange: req.body.finalizedInfo.exchange,

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
    response = await getTrackingsHelper(req);
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
          doc.onlineTrackings.forEach(t => {if (t.trackingNumber.match(new RegExp(req.query.searchTerm, 'i'))) {result = true}})
          doc.servicedTrackings.forEach(t => {if (t.trackingNumber.match(new RegExp(req.query.searchTerm, 'i'))) {result =  true}})
          doc.inPersonTrackings.forEach(t => {if (t.trackingNumber.match(new RegExp(req.query.searchTerm, 'i'))) {result = true}})
      }

      if (!result && req.query.type === TrackingTypes.MASTER) {
        doc.boxes.forEach(b => {
          b.items.forEach(t => {if (t.trackingNumber.match(new RegExp(req.query.searchTerm, 'i'))) {result = true}})
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
    'generalInfo.organizationId': orgId
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
      return await paginationHelper(+query.pageSize, +query.currentPage, trackingQuery1).populate("carrierTracking").populate('generalInfo.comments').populate('linkedTo').lean().exec().then(callbackfunction);
    case TrackingTypes.SERVICED:
      let trackingQuery2 = ServicedTrackingModel.find(queryBody);
      totalCount = await ServicedTrackingModel.countDocuments().then(count => {return count});
      return await paginationHelper(+query.pageSize, +query.currentPage, trackingQuery2).populate('generalInfo.comments').populate('linkedTo').lean().exec().then(callbackfunction);
    case TrackingTypes.INPERSON:
      let trackingQuery3 = InPersonTrackingModel.find(queryBody);
      totalCount = await InPersonTrackingModel.countDocuments().then(count => {return count});
      return await paginationHelper(+query.pageSize, +query.currentPage, trackingQuery3).populate('generalInfo.comments').populate('linkedTo').lean().exec().then(callbackfunction);
    case TrackingTypes.CONSOLIDATED:
      let trackingQuery4 = ConsolidatedTrackingModel.find(queryBody);
      totalCount = await ConsolidatedTrackingModel.countDocuments().then(count => {return count});
      return await paginationHelper(+query.pageSize, +query.currentPage, trackingQuery4).populate("onlineTrackings").populate('linkedTo').populate("servicedTrackings").populate("inPersonTrackings").populate('generalInfo.comments').lean().exec().then(callbackfunction);
    case TrackingTypes.MASTER:
      let trackingQuery5 = MasterTrackingModel.find(queryBody);
      totalCount = await MasterTrackingModel.countDocuments().then(count => {return count});
      return await paginationHelper(+query.pageSize, +query.currentPage, trackingQuery5).populate("boxes.items").populate('generalInfo.comments').lean().exec().then(callbackfunction);
    default:
      return {
        trackings: [],
        count: 0
      };
  }
}

populateSenderInfo = async (documents) => {
  for (d of documents) {
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
        for (t of b.items) {
          t.generalInfo.sender = await UserController.getUserByIdHelper(t.generalInfo.sender);
        }
      }
    }

    if (d.trackingNumber.substring(0,3) === TrackingTypes.MASTER) {
      for (b of d.boxes) {
        for (t of b.items) {
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
    tracking.generalInfo.sender = await UserController.getUserByIdHelper(tracking.generalInfo.sender);
    return res.status(200).json(tracking);

  } catch(error) {
    console.log(`getTracking: ${req.params.id} ${error.message}`);
    return res.status(500).json({message: "Couldn't fetch tracking"});
  };
}

getTrackingHelper = async (type, id, orgId, byId) => {

  let queryParams = {
    'generalInfo.organizationId': orgId
  };

  if (byId) {
    queryParams['_id'] = id;
  } else {
    queryParams['trackingNumber'] = id;
  }


  let tracking = null;
  switch(type) {
    case TrackingTypes.ONLINE:
      return await OnlineTrackingModel.findOne(queryParams).populate('carrierTracking').populate('linkedTo').lean()
        .then(async tracking => {
          await populateSenderInfo([tracking]);
          return tracking;});
    case TrackingTypes.SERVICED:
      break;
    case TrackingTypes.INPERSON:
      return await InPersonTrackingModel.findOne(queryParams).populate('linkedTo').lean()
        .then(async tracking => {
          await  populateSenderInfo([tracking]);
          return tracking;});
    case TrackingTypes.CONSOLIDATED:
      return await ConsolidatedTrackingModel.findOne(queryParams)
      .populate('onlineTrackings')
      .populate('servicedTrackings')
      .populate('inPersonTrackings')
      .populate('linkedTo')
      .lean()
        .then(async tracking => {
          await populateSenderInfo([tracking]);
          return tracking;});
    case TrackingTypes.MASTER:
      return await MasterTrackingModel.findOne(queryParams)
      .populate('boxes.items').lean()
        .then(async tracking => {
          await populateSenderInfo([tracking]);
          return tracking;});
    default:
      return tracking;
  }
}

/**
 * Check if all the child trackings are in the same status of received at destination, being delivered or delivered and update the parent tracking
 * This only apply to post ReceivedAtDestination statuses and paid
 * tracking: A populated consolidated/master tracking
 */
populateConsolidatedMasterTrackingStatus = async (userId, tracking, session) => {
  const allEqual = arr => arr.every( v => v === arr[0]);

  if (tracking.trackingNumber.substring(0, 3) === TrackingTypes.CONSOLIDATED) {
    let online = tracking.onlineTrackings? tracking.onlineTrackings.map(o => o.generalInfo.status) : [];
    let serviced = tracking.servicedTrackings? tracking.servicedTrackings.map(s => s.generalInfo.status): [];
    let inPerson = tracking.inPersonTrackings? tracking.inPersonTrackings.map(c => c.generalInfo.status): [];

    let status = null;
    if (allEqual([...online, ...serviced, ...inPerson])) {
      status = online.length > 0? online[0] : serviced.length > 0 ? serviced[0] : inPerson.length > 0? inPerson[0] : null;
    } else if ((online.length > 0 || serviced.length > 0 || inPerson.length > 0)) {
      status = allStatusTypes.BeingDeliveredToRecipient;
    }

    online = tracking.onlineTrackings? tracking.onlineTrackings.map(o => o.generalInfo.paid) : [];
    serviced = tracking.servicedTrackings? tracking.servicedTrackings.map(s => s.generalInfo.paid) : [];
    inPerson = tracking.inPersonTrackings? tracking.inPersonTrackings.map(c => c.generalInfo.paid) : [];
    let paid = null;
    if (allEqual([...online, ...serviced, ...inPerson])) {
      paid = online.length > 0? online[0] : serviced.length > 0 ? serviced[0] : inPerson.length > 0? inPerson[0] : null;
    } else {
      paid = false;
    }

    if (postReceivedAtDestinationStatuses.includes(tracking.generalInfo.status) && status && status !== tracking.generalInfo.status) {
      await changeTrackingStatusHelper(userId, TrackingTypes.CONSOLIDATED, status, [tracking.trackingNumber], false, session);
    }
    if (paid != null && paid !== tracking.generalInfo.paid) {
      await changeTrackingStatusHelper(userId, TrackingTypes.CONSOLIDATED, paid == true? "Paid" : "Unpaid", [tracking.trackingNumber], false, session) // Paid can be undefined
    }
  } else if (tracking.trackingNumber.substring(0, 3) === TrackingTypes.MASTER) {
    let consolidated = [];
    for (b of tracking.boxes) {
      consolidated.push(...(b.items? b.items.map(t => t.generalInfo.status) : []));
    }
    let status = null;
    if (allEqual(consolidated) && consolidated.length > 0) {
      status = consolidated[0];
    } else if (consolidated.length > 0) {
      status = allStatusTypes.BeingDeliveredToRecipient;
    }

    consolidated = [];
    for (b of tracking.boxes) {
      consolidated.push(...(b.items? b.items.map(t => t.generalInfo.paid) : []));
    }
    let paid = null;
    if (allEqual(consolidated) && consolidated.length > 0) {
      paid = consolidated[0];
    } else {
      paid = false;
    }

    if (postReceivedAtDestinationStatuses.includes(tracking.generalInfo.status) && status && status !== tracking.generalInfo.status) {
      await changeTrackingStatusHelper(userId, TrackingTypes.MASTER, status, [tracking.trackingNumber], false, session);
    }
    if (paid != null && paid !== tracking.generalInfo.paid) {
      await changeTrackingStatusHelper(userId, TrackingTypes.MASTER, paid == true? "Paid" : "Unpaid", [tracking.trackingNumber], false, session) // Paid can be undefined
    }
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
        await changeStatusForConsolidatedHelper(req.userData.uid, req.userData.orgId, req.body.status, [req.body.trackingNumber], false, null, null, null, session);
      } else {
        await changeTrackingStatusHelper(req.userData.uid, type, req.body.status, [req.body.trackingNumber], false, session);
      }
    });
    session.endSession();
    tracking = await getTrackingHelper(type, req.body.trackingNumber, req.userData.orgId, false);


    // Open another session since we have to end previous session for the tracking to be udpated
    session = await db.startSession();
    tracking = await getTrackingHelper(type, req.body.trackingNumber, req.userData.orgId, false);

    await session.withTransaction(async () => {
      if (type === TrackingTypes.CONSOLIDATED) {
        if (tracking.linkedTo) {
          linkedToTracking = await getTrackingHelper(TrackingTypes.MASTER, tracking.linkedTo, req.userData.orgId, true);
          await populateConsolidatedMasterTrackingStatus(req.userData.uid, linkedToTracking, session);
        }
      } else if (type !== TrackingTypes.MASTER) {
        if (tracking.linkedTo) {
          linkedToTracking = await getTrackingHelper(TrackingTypes.CONSOLIDATED, tracking.linkedTo, req.userData.orgId, true);
          await populateConsolidatedMasterTrackingStatus(req.userData.uid, linkedToTracking, session);
        }
      }
    });

    session.endSession();
    return res.status(200).json({message: "Status changed successfully", tracking: tracking});

  } catch (error) {
    console.log(`changeTrackingStatus: ${error}`);
    return res.status(500).json({message: "Status change failed"});
  }
}

changeStatusForMasterHelper = async (userId, orgId, status, trackingNumber, edit, validConsolidatedTrackingNumbers, removedConsolidatedTrackingNumbers, session) => { // When turning the switches
  if (edit) {
    if (status === allStatusTypes.Created) {
      status = allStatusTypes.ReadyToFly;
    }

    await changeStatusForConsolidatedHelper(userId, orgId, status, validConsolidatedTrackingNumbers, false, null, null, null, session);
    await linkUnlinkTrackingHelper(userId, TrackingTypes.CONSOLIDATED, validConsolidatedTrackingNumbers, trackingNumber, false, true, session); // validConsolidatedTrackingNumbers are tracking numbers
    await changeStatusForConsolidatedHelper(userId, orgId, allStatusTypes.Created, removedConsolidatedTrackingNumbers, false, null, null, null, session);
    await linkUnlinkTrackingHelper(userId, TrackingTypes.CONSOLIDATED, removedConsolidatedTrackingNumbers, trackingNumber, false, false, session);

  } else {
    let masterTracking = await getTrackingHelper(TrackingTypes.MASTER, trackingNumber, orgId, false);
    let consolidatedTrackings = [];

    masterTracking.boxes.forEach(b => {
      consolidatedTrackings.push(...b.items.map(i => i.trackingNumber));
    })

    await changeStatusForConsolidatedHelper(userId, orgId, status, consolidatedTrackings, false, null, null, null, session);

    if (status === allStatusTypes.ReadyToFly) {
      status = allStatusTypes.Created;
    }

    await changeTrackingStatusHelper(userId, TrackingTypes.MASTER, status, [trackingNumber], false, session)
    return await getTrackingHelper(TrackingTypes.MASTER, trackingNumber, orgId, false);
  }
}

/**
 * Just a helper for other methods, or when switches of consolidated trackings are switched
 * consolidatedTrackings: A list of consolidated tracking numbers
 */
changeStatusForConsolidatedHelper = async (userId, orgId, status, consolidatedTrackings, edit, validTrackings, removedTrackings, toTrackingId, session) => {

  if (edit) {
    if (status === allStatusTypes.Created) {
      status = allStatusTypes.Consolidated;
    }

    await changeTrackingStatusHelper(userId, TrackingTypes.ONLINE, status, validTrackings[0], true, session);
    await changeTrackingStatusHelper(userId, TrackingTypes.SERVICED, status, validTrackings[1], true, session);
    await changeTrackingStatusHelper(userId, TrackingTypes.INPERSON, status, validTrackings[2], true, session);
    await linkUnlinkTrackingHelper(userId, TrackingTypes.ONLINE, validTrackings[0], toTrackingId, true, true, session);
    await linkUnlinkTrackingHelper(userId, TrackingTypes.SERVICED, validTrackings[1], toTrackingId, true, true, session);
    await linkUnlinkTrackingHelper(userId, TrackingTypes.INPERSON, validTrackings[2], toTrackingId, true, true, session);

    await changeTrackingStatusHelper(userId, TrackingTypes.ONLINE, allStatusTypes.ReceivedAtOrigin, removedTrackings[0], false, session);
    await changeTrackingStatusHelper(userId, TrackingTypes.SERVICED, allStatusTypes.Created, removedTrackings[1], false, session);
    await changeTrackingStatusHelper(userId, TrackingTypes.INPERSON, allStatusTypes.Created, removedTrackings[2], false, session);
    await linkUnlinkTrackingHelper(userId, TrackingTypes.ONLINE, removedTrackings[0], toTrackingId, false, false, session);
    await linkUnlinkTrackingHelper(userId, TrackingTypes.SERVICED, removedTrackings[1], toTrackingId, false, false, session);
    await linkUnlinkTrackingHelper(userId, TrackingTypes.INPERSON, removedTrackings[2], toTrackingId, false, false, session);

  } else {
    let onlineTrackings = [];
    let servicedTrackings = [];
    let inPersonTrackings = [];

    for (tid of consolidatedTrackings) {
      let tracking = await getTrackingHelper(TrackingTypes.CONSOLIDATED, tid, orgId, false);
      onlineTrackings.push(...tracking.onlineTrackings.map(o => o.trackingNumber));
      servicedTrackings.push(...tracking.servicedTrackings.map(o => o.trackingNumber));
      inPersonTrackings.push(...tracking.inPersonTrackings.map(o => o.trackingNumber));
    }

    let statuses = [status, status, status, status]

    if (status === allStatusTypes.Created) { // Unreceive
      statuses = [allStatusTypes.Created, allStatusTypes.Consolidated, allStatusTypes.Consolidated, allStatusTypes.Consolidated];
    }

    await changeTrackingStatusHelper(userId, TrackingTypes.CONSOLIDATED, statuses[0], consolidatedTrackings, false, session);
    await changeTrackingStatusHelper(userId, TrackingTypes.ONLINE, statuses[1], onlineTrackings, false, session);
    await changeTrackingStatusHelper(userId, TrackingTypes.SERVICED, statuses[2], servicedTrackings, false, session);
    await changeTrackingStatusHelper(userId, TrackingTypes.INPERSON, statuses[3], inPersonTrackings, false, session);
  }
}

linkUnlinkTrackingHelper = async (userId, type, itemsList, toTrackingId, byIds, link, session) => {
  if (itemsList.length == 0) {
    return;
  }

  let queryParams = byIds? {"_id": {$in: itemsList}} : {"trackingNumber": {$in: itemsList}};
  let setParams = link? {"linkedTo": toTrackingId} : {"linkedTo": null};

  await updateManyGeneralHelper(type, queryParams, setParams, session);

  let action = link? "Link": "Unlink";
  await createHistoryHelper(userId, `${action} -> ${toTrackingId}`, itemsList.toString(), session);
  console.log(`linkUnlinkTracking: User id ${userId} ${action} ${itemsList} -> ${toTrackingId}`)
}

changeTrackingStatusHelper = async (userId, type, status, itemsList, byIds, session) => {
  if (![...Object.values(allStatusTypes), "Paid", "Unpaid"].includes(status) || itemsList.length == 0) {
    return;
  }

  let queryParams = byIds? {"_id": {$in: itemsList}} : {"trackingNumber": {$in: itemsList}};

  let setParams = {};

  if (status == "Paid") {
    setParams["generalInfo.paid"] = true;
  } else if (status == "Unpaid") {
    setParams["generalInfo.paid"] = false;
  } else {
    setParams["generalInfo.status"] = status;
  }

  await updateManyGeneralHelper(type, queryParams, setParams, session);
  await createHistoryHelper(userId, `Updated status to ${status}`, itemsList.toString(), session);
  console.log(`changeTrackingStatus: User id ${userId} updated ${itemsList} -> ${status}`)

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

