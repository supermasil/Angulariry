const CommentModel = require('../models/comment');
const UserController = require("../controllers/users");
const OnlineTrackingModel = require('../models/tracking-models/online-tracking');
const db = require('mongoose');

exports.createComment = async (req, res, next) => {
  try {
    let user = await UserController.getUserHelper(req.userData.uid);
    const comment = new CommentModel ({
      creatorId: req.userData.uid,
      trackingId: req.body.trackingId,
      name: user.name,
      imagePaths: req.body.imagePaths,
      content: req.body.content,
      attachmentPaths: req.body.attachmentPaths
    });


    const session = await db.startSession();
    return await session.withTransaction(async () => {
      let createdComment = await CommentModel.create([comment], {session: session}) // This returns an array
        .then(createdComment => {
          return createdComment;
        });

      await OnlineTrackingModel.findById(req.body.trackingId).session(session)
        .then(async(foundTracking) => {
          foundTracking.comments.unshift(createdComment[0]._id);
          await foundTracking.save();
        });

      return res.status(200).json({
        // message: "Comment created successfully", // Too much noise
        comment: createdComment[0]});
    })
  } catch(error) {
    console.log("createComment: " + error.message);
    return res.status(500).json({message: "Comment creation failed"});
  }


}

exports.deleteComment = async (req, res, next) => {
  return await CommentModel.deleteOne({ _id: req.body._id, creatorId: req.userData.uid })
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
    imagePaths: req.body.imagePaths,
    content: req.body.content,
    attachmentPaths: req.body.attachmentPaths
  });

  return await CommentModel.updateOne({ _id: req.body._id, creatorId: req.userData.uid }, comment)
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
