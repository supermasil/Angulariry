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
  MASTER: "mst"
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
  DeliveredToRecipient: "Delivered to recipient"
}

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
      await changeStatusForConsolidatedOnEditHelper(req);
    }

    if (type === TrackingTypes.MASTER) {
      updateBody['boxes'] = req.body.boxes;
      await changeStatusForMasterOnEditHelper(req);
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
      await changeStatusForConsolidatedOnEditHelper(req);
    }

    if (type === TrackingTypes.MASTER) {
      newBody['boxes'] = req.body.boxes;
      await changeStatusForMasterOnEditHelper(req);
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
    assert(req.query.orgId != null, "orgId is null");
    results = []
    switch (req.query.type) {
      case TrackingTypes.ONLINE:
        results = await fuzzySearchHelper(req, OnlineTrackingModel, TrackingTypes.ONLINE);
        break;
      case TrackingTypes.SERVICED:
        results = await fuzzySearchHelper(req, ServicedTrackingModel, TrackingTypes.SERVICED);
        break;
      case TrackingTypes.INPERSON:
        results = await fuzzySearchHelper(req, InPersonTrackingModel, TrackingTypes.INPERSON);
        break;
      case TrackingTypes.CONSOLIDATED:
        results = await fuzzySearchHelper(req, ConsolidatedTrackingModel, TrackingTypes.CONSOLIDATED);
        break;
      case TrackingTypes.MASTER:
        results = await fuzzySearchHelper(req, MasterTrackingModel, TrackingTypes.MASTER);
        break;
    }

    return res.status(200).json({
      trackings: results,
      count: results.length
    })
  } catch (error) {
    console.log("trackingFuzzySearch: " + error.message);
    return res.status(500).json({message: "Couldn't search for this term"});
  }
}

fuzzySearchHelper = async (req, model, type) => {
  let extraPopulation = '';

  if (type === TrackingTypes.ONLINE) {
    extraPopulation = 'carrierTracking'
  }

  return await model.find({'generalInfo.organizationId': req.query.orgId}).populate(extraPopulation).populate('comments').then(docs => {
    docs = docs.filter((doc) => {
      let result = false;
      if (type === TrackingTypes.ONLINE) {
        result = result || doc.carrierTracking.carrierTrackingNumber.match(new RegExp(req.query.searchTerm, 'i')) ||
        doc.carrierTracking.status.match(new RegExp(req.query.searchTerm, 'i')) ||
        doc.carrierTracking.carrier.match(new RegExp(req.query.searchTerm, 'i'))
      }
      result = result || doc.trackingNumber.match(new RegExp(req.query.searchTerm, 'i')) ||
      doc.generalInfo.status.match(new RegExp(req.query.searchTerm, 'i'))

      if (type !== TrackingTypes.MASTER) {
        result = result || doc.generalInfo.sender.match(new RegExp(req.query.searchTerm, 'i'))
      }

      return result;
    })
    return docs;
  })
  // const trackingQuery = model.fuzzySearch({ query: req.query.searchTerm, minSize: 2, exact: true});

}

exports.getTrackings = async (req, res, next) => {
  try {
    assert(req.query.type != undefined, "Query type is undefined");
    assert(req.userData.orgId != null, "orgId is null");

    queryBody = {
      'generalInfo.organizationId': req.userData.orgId
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

    let trackingQuery = null;

    let totalCount = 0;
    finalQuery = null;

    switch (req.query.type) {
      case TrackingTypes.ONLINE:
        trackingQuery = OnlineTrackingModel.find(queryBody);
        finalQuery = fetchTrackingsHelper(req, trackingQuery).populate("carrierTracking");
        totalCount = await OnlineTrackingModel.countDocuments().then(count => {return count});
        break;
      case TrackingTypes.SERVICED:
        trackingQuery = ServicedTrackingModel.find(queryBody);
        finalQuery = fetchTrackingsHelper(req, trackingQuery);
        totalCount = await ServicedTrackingModel.countDocuments().then(count => {return count});
        break;
      case TrackingTypes.INPERSON:
        trackingQuery = InPersonTrackingModel.find(queryBody);
        finalQuery = fetchTrackingsHelper(req, trackingQuery);
        totalCount = await InPersonTrackingModel.countDocuments().then(count => {return count});
        break;
      case TrackingTypes.CONSOLIDATED:
        trackingQuery = ConsolidatedTrackingModel.find(queryBody);
        finalQuery = fetchTrackingsHelper(req, trackingQuery).populate("onlineTrackings").populate("servicedTrackings").populate("inPersonTrackings");
        totalCount = await ConsolidatedTrackingModel.countDocuments().then(count => {return count});
        break;
      case TrackingTypes.MASTER:
        trackingQuery = MasterTrackingModel.find(queryBody);
        finalQuery = fetchTrackingsHelper(req, trackingQuery).populate("boxes.items");
        totalCount = await MasterTrackingModel.countDocuments().then(count => {return count});
        break;
    }

    assert(trackingQuery != null, "trackingQuery is null");

    return await finalQuery.populate('generalInfo.comments').lean().exec()
      .then(async documents => {
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
        }
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

fetchTrackingsHelper = (req, trackingQuery) => {
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
    let tracking = await getTrackingHelperByTrackingNumber(req);
    assert(tracking != null);
    tracking.generalInfo.sender = await UserController.getUserByIdHelper(tracking.generalInfo.sender);
    return res.status(200).json(tracking);

  } catch(error) {
    console.log(`getTracking: ${req.params.id} ${error.message}`);
    return res.status(500).json({message: "Couldn't fetch tracking"});
  };
}

getTrackingHelperByTrackingNumber = async (req) => {
  let queryParams = {
    trackingNumber: req.params.id,
    'generalInfo.organizationId': req.userData.orgId
  };
  let type = req.params.id.substring(0, 3);
  return await getTrackingHelper(queryParams, type);
}

getTrackingHelperById = async (req, type) => {
  let queryParams = {
    _id: req.params.id,
    'generalInfo.organizationId': req.userData.orgId
  };
  return await getTrackingHelper(queryParams, type);
}

getTrackingHelper = async (queryParams, type) => {
  let tracking = null;
  switch(type) {
    case TrackingTypes.ONLINE:
      return await OnlineTrackingModel.findOne(queryParams).populate('carrierTracking').lean()
        .then(tracking => {return tracking;});
    case TrackingTypes.SERVICED:
      break;
    case TrackingTypes.INPERSON:
      return await InPersonTrackingModel.findOne(queryParams).lean()
        .then(tracking => {return tracking;});
    case TrackingTypes.CONSOLIDATED:
      return await ConsolidatedTrackingModel.findOne(queryParams)
      .populate('onlineTrackings')
      .populate('servicedTrackings')
      .populate('inPersonTrackings')
      .lean()
        .then(tracking => {return tracking;});
    case TrackingTypes.MASTER:
      return await MasterTrackingModel.findOne(queryParams)
      .populate('boxes.items').lean()
        .then(tracking => {return tracking;});
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
    let tracking = null;
    req.params.id = req.body.trackingNumber;
    req.params.orgId = req.userData.orgId;

    if (req.body.trackingNumber.substring(0, 3) === TrackingTypes.MASTER) {
      tracking = await changeStatusForMasterHelper(req);
    } else {
      await changeTrackingStatusByTrackingNumbers(req, req.body.trackingNumber.substring(0, 3), req.body.status, [req.body.trackingNumber]);
      tracking = await getTrackingHelperByTrackingNumber(req);
    }
    return res.status(200).json({message: "Status changed successfully", tracking: tracking});
  } catch (error) {
    console.log(`changeTrackingStatus: ${error}`);
    return res.status(500).json({message: "Status change failed"});
  }
}

changeStatusForConsolidatedOnEditHelper = async (req) => { // When creating/editting master
  let status = allStatusTypes.Unknown;
  if (req.body.generalInfo.status === allStatusTypes.Created) {
    status = allStatusTypes.Consolidated;
  } else {
    status = req.body.generalInfo.status;
  }
  await changeTrackingStatusByIds(req, TrackingTypes.ONLINE, status, req.body.onlineTrackings);
  await changeTrackingStatusByIds(req, TrackingTypes.SERVICED, status, req.body.servicedTrackings);
  await changeTrackingStatusByIds(req, TrackingTypes.INPERSON, status, req.body.inPersonTrackings);
  await changeTrackingStatusByTrackingNumbers(req, TrackingTypes.ONLINE, allStatusTypes.ReceivedAtOrigin, req.body.removedOnlineTrackings);
  await changeTrackingStatusByTrackingNumbers(req, TrackingTypes.SERVICED, allStatusTypes.Created, req.body.removedServicedTrackings);
  await changeTrackingStatusByTrackingNumbers(req, TrackingTypes.INPERSON, allStatusTypes.Created, req.body.removedInPersonTrackings);
}

changeStatusForMasterOnEditHelper = async (req) => { // When creating/editting master
  if (req.body.generalInfo.status === allStatusTypes.Created) {
    req.body.status = allStatusTypes.ReadyToFly;
  } else {
    req.body.status = req.body.generalInfo.status;
  }

  await changeStatusForConsolidatedHelper(req, req.body.validTrackingNumbers); // this is by tracking

  req.body.status = allStatusTypes.Created;
  await changeStatusForConsolidatedHelper(req, req.body.removedConsolidatedTrackingNumbers); // this is by tracking
}

changeStatusForMasterHelper = async (req) => { // When turning the switches
  let masterTracking = await getTrackingHelperByTrackingNumber(req, true, null);
  let consolidatedTrackings = [];

  masterTracking.boxes.forEach(b => {
    consolidatedTrackings.push(...b.items.map(i => i.trackingNumber));
  })

  await changeStatusForConsolidatedHelper(req, consolidatedTrackings);
  await changeTrackingStatusByTrackingNumbers(req, TrackingTypes.MASTER, req.body.status, [masterTracking.trackingNumber]);

  if (req.body.status === allStatusTypes.ReadyToFly) {
    console.log(req.body.status)
    req.body.status = allStatusTypes.Created;
  }

  masterTracking.generalInfo.status = req.body.status;
  return masterTracking;
}

changeStatusForConsolidatedHelper = async (req, consolidatedTrackings) => { // Just a helper for others
  let onlineTrackings = [];
  let servicedTrackings = [];
  let inPersonTrackings = [];

  for (tid of consolidatedTrackings) {
    req.params.id = tid;
    let tracking = await getTrackingHelperByTrackingNumber(req);
    onlineTrackings.push(...tracking.onlineTrackings.map(o => o.trackingNumber));
    servicedTrackings.push(...tracking.servicedTrackings.map(o => o.trackingNumber));
    inPersonTrackings.push(...tracking.inPersonTrackings.map(o => o.trackingNumber));
  }

  if (req.body.status === allStatusTypes.Created) { // Unreceive
    await changeTrackingStatusByTrackingNumbers(req, TrackingTypes.CONSOLIDATED, allStatusTypes.Created, consolidatedTrackings);
    await changeTrackingStatusByTrackingNumbers(req, TrackingTypes.ONLINE, allStatusTypes.Consolidated, onlineTrackings);
    await changeTrackingStatusByTrackingNumbers(req, TrackingTypes.SERVICED, allStatusTypes.Consolidated, servicedTrackings);
    await changeTrackingStatusByTrackingNumbers(req, TrackingTypes.INPERSON, allStatusTypes.Consolidated, inPersonTrackings);
  } else { // Ready to Fly, Flying, Received At Destination
    await changeTrackingStatusByTrackingNumbers(req, TrackingTypes.CONSOLIDATED, req.body.status, consolidatedTrackings);
    await changeTrackingStatusByTrackingNumbers(req, TrackingTypes.ONLINE, req.body.status, onlineTrackings);
    await changeTrackingStatusByTrackingNumbers(req, TrackingTypes.SERVICED, req.body.status, servicedTrackings);
    await changeTrackingStatusByTrackingNumbers(req, TrackingTypes.INPERSON, req.body.status, inPersonTrackings);
  }
}


changeTrackingStatusByTrackingNumbers = async (req, type, status, idsList) => {
  queryParams = {
    "trackingNumber": {$in: idsList}
  }
  await changeTrackingsStatusHelper(req, type, status, queryParams);
  idsList.forEach(async id => {
    createHistoryHelper(req.userData.uid, `Updated status to ${status}`, id, null);
    console.log(`changeTrackingStatus: Status changed successfully ${id}`)
  });
}

changeTrackingStatusByIds = async (req, type, status, idsList) => {
  queryParams = {
    "_id": {$in: idsList}
  }
  await changeTrackingsStatusHelper(req, type, status, queryParams);
  idsList.forEach(async id => {
    createHistoryHelper(req.userData.uid, `Updated status to ${status}`, id.toString(), null);
    console.log(`changeTrackingStatus: Status changed successfully ${id.toString()}`)
  });
}

changeTrackingsStatusHelper = async (req, type, status, queryParams) => {
  switch (type) {
    case TrackingTypes.ONLINE:
      await OnlineTrackingModel.updateMany(queryParams, {$set:{"generalInfo.status": status}}).then();
      break;
    case TrackingTypes.SERVICED:
      await ServicedTrackingModel.updateMany(queryParams, {$set:{"generalInfo.status": status}}).then();
      break;
    case TrackingTypes.INPERSON:
      await InPersonTrackingModel.updateMany(queryParams, {$set:{"generalInfo.status": status}}).then();
      break;
    case TrackingTypes.CONSOLIDATED:
      await ConsolidatedTrackingModel.updateMany(queryParams, {$set:{"generalInfo.status": status}}).then();
      break;
    case TrackingTypes.MASTER:
      await MasterTrackingModel.updateMany(queryParams, {$set:{"generalInfo.status": status}}).then();
      break;
    default:
      return;
  }
}

