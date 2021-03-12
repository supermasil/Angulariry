const CommentModel = require('../models/comment');
const UserController = require("../controllers/users");
const OnlineTrackingModel = require('../models/tracking-models/online-tracking');
const ServiceTrackingModel = require('../models/tracking-models/serviced-tracking');
const InPersonTrackingModel = require('../models/tracking-models/in-person-tracking');
const ConsolidatedTrackingModel = require('../models/tracking-models/consolidated-tracking');
const MasterTrackingModel = require('../models/tracking-models/master-tracking');
const db = require('mongoose');

const TrackingTypes = Object.freeze({
  ONLINE: "onl",
  SERVICED: "sev",
  INPERSON: "inp",
  CONSOLIDATED: "csl",
  MASTER: "mst"
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

      switch(req.body.trackingNumber.substring(0, 3)) {
        case TrackingTypes.ONLINE:
          model = OnlineTrackingModel;
          break;
        case TrackingTypes.SERVICED:
          model = ServiceTrackingModel;
          break;
        case TrackingTypes.INPERSON:
          model = InPersonTrackingModel;
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

      console.log("createComment: Comment created successfully for tracking number " + req.body.trackingNumber);
      return res.status(200).json(createdComment);
    })
  } catch(error) {
    console.log("createComment: " + error);
    return res.status(500).json({message: "Comment creation failed"});
  }
}

exports.deleteComment = async (req, res, next) => {
  return await CommentModel.deleteOne({ _id: req.body._id, organization: req.userData.orgId })
  .then(deletedCommentData => {
    if (deletedCommentData.deletedCount > 0) {
      return res.status(201).json({message: "Comment deleted sucessfully"});
    } else {
      return res.status(404).json({message: "No comment was deleted"});
    }
  })
  .catch(error => {
    console.log(error.message);
    return res.status(500).json({message: "Comment deletion failed"});
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
        return res.status(201).json({message: "Comment updated sucessfully"});
      } else {
        return res.status(404).json({message: "No comment was updated"});
      }
    })
    .catch(error => {
      console.log(error.message);
      return res.status(500).json({message: "Comment update failed"});
    });
}
