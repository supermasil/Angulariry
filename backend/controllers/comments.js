const Comment = require('../models/comment');
const UserController = require("../controllers/users");
const Tracking = require('../models/tracking');
const db = require('mongoose');

exports.createComment = async (req, res, next) => {
  try {
    const comment = new Comment ({
      creatorId: req.userData.uid,
      trackingId: req.body.trackingId,
      name: (await UserController.getUserHelper(req.userData.uid)).name,
      imagePaths: req.body.imagePaths,
      content: req.body.content,
      attachmentPaths: req.body.attachmentPaths
    });


    const session = await db.startSession();
    return await session.withTransaction(async () => {
      let createdComment = await Comment.create([comment], {session: session}) // This returns an array
        .then(createdComment => {
          return createdComment;
        });

      await Tracking.findById(req.body.trackingId).session(session)
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
  return await Comment.deleteOne({ _id: req.body._id, creatorId: req.userData.uid })
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
  const comment = new Comment ({
    imagePaths: req.body.imagePaths,
    content: req.body.content,
    attachmentPaths: req.body.attachmentPaths
  });

  return await Comment.updateOne({ _id: req.body._id, creatorId: req.userData.uid }, comment)
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
