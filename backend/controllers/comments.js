const CommentModel = require('../models/comment');
const UserController = require("../controllers/users");
const OnlineTrackingModel = require('../models/tracking-models/online-tracking');
const ServiceTrackingModel = require('../models/tracking-models/serviced-tracking');
const InPersonTrackingModel = require('../models/tracking-models/in-person-tracking');
const InPersonSubTrackingModel = require('../models/tracking-models/in-person-tracking-sub');
const ConsolidatedTrackingModel = require('../models/tracking-models/consolidated-tracking');
const MasterTrackingModel = require('../models/tracking-models/master-tracking');
const db = require('mongoose');
const app = require("../app");

const TrackingTypes = Object.freeze({
  ONLINE: "onl",
  SERVICED: "sev",
  INPERSON: "inp",
  INPERSONSUB: "inpsub",
  CONSOLIDATED: "csl",
  MASTER: "mst",
});

exports.createComment = async (req, res, next) => {
  try {
    let user = await UserController.getUserByIdHelper(req.userData, req.userData.u_id, 'mongo');
    const comment = new CommentModel ({
      creatorId: req.userData.u_id,
      trackingId: req.body.trackingId,
      creatorName: user.name,
      filePaths: req.body.imagePaths,
      content: req.body.content,
      organization: req.userData.orgId
    });


    const session = await db.startSession();
    return await session.withTransaction(async () => {
      let createdComment = await CommentModel.create([comment], {session: session}) // This returns an array
        .then(createdComment => {
          return createdComment[0]
        });

      let model = null;

      let type = (req.body.trackingNumber.match(/-/g) || []).length == 1? req.body.trackingNumber.substring(0, 3): TrackingTypes.INPERSONSUB;

      switch(type) {
        case TrackingTypes.ONLINE:
          model = OnlineTrackingModel;
          break;
        case TrackingTypes.SERVICED:
          model = ServiceTrackingModel;
          break;
        case TrackingTypes.INPERSON:
          model = InPersonTrackingModel;
          break;
        case TrackingTypes.INPERSONSUB:
          model = InPersonSubTrackingModel;
          break;
        case TrackingTypes.CONSOLIDATED:
          model = ConsolidatedTrackingModel;
          break;
        case TrackingTypes.MASTER:
          model = MasterTrackingModel;
          break;
      }

      await model.findById(req.body.trackingId).session(session)
        .then(async(foundTracking) => {
          foundTracking.generalInfo.comments.unshift(createdComment._id);
          await foundTracking.save();
        });

      return next({
        resCode: 200,
        resBody: createdComment
      });
    })
  } catch(error) {
    return next({
      error: error
    });
  }
}

exports.deleteComment = async (req, res, next) => {
  return await CommentModel.deleteOne({ _id: req.body._id, organization: req.userData.orgId })
  .then(deletedCommentData => {
    if (deletedCommentData.deletedCount > 0) {
      return next({
        resCode: 200,
        resBody: {message: "deletion-success"}
      })
    } else {
      return next({
        error: new Error("No comment was deleted")
      });
    }
  })
  .catch(error => {
    return next({
      error: error
    });
  });
}

exports.updateComment = async (req, res, next) => {
  const comment = new CommentModel ({
    filePaths: req.body.filePaths,
    content: req.body.content
  });

  return await CommentModel.updateOne({ _id: req.body._id, organization: req.userData.orgId }, comment)
    .then(updatedComment => {
      if (updatedComment.nModified > 0) {
        return next({
          resCode: 200,
          resBody: {message: "update-success"}
        });
      } else {
        return next({
          error: new Error("No comment was updated")
        });
      }
    })
    .catch(error => {
      return next({
        error: error
      });
    });
}
