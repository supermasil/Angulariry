// const Post = require('../models/post');
// const User = require('../models/user');
// const db = require('mongoose');
// const globals = require('../config/globals');

// const OPERATIONS = {
//   SUBSCRIBE: "subscribePost",
//   UNSUBCRIBE: "unSubscribePost"
// }

// exports.getSubscribedPosts = async (req, res, next) => {
//   await User.findOne({email: req.userData.email}).then(foundUser => {
//     return res.status(200).json({subscribedPosts: foundUser.subscribedPosts});
//   })
//   .catch(error => {
//     console.log("getSubscriptions: " + error.message);
//     return res.status(500);
//   });
// }

// exports.subscribePost = async (req, res, next) => {
//   return await subscriptionHelper(req, res, "subscribePost");
// }

// exports.unSubscribePost = async (req, res, next) => {
//   return await subscriptionHelper(req, res, "unSubscribePost");
// }

// subscriptionHelper = async (req, res, subType) => {
//   const session = await db.startSession();

//   await session.withTransaction(async () => {
//     const foundUser = await updateUserHelper(req, subType, session);
//     await updatePostHelper(req, foundUser.id, subType, session);

//     let message = subType === OPERATIONS.SUBSCRIBE ? globals.subscribePostSuccessMessage : globals.unSubscribePostSuccessMessage;
//     return res.status(200).json({subscribedPosts: foundUser.subscribedPosts, message: message});
//   })
//   .catch(error => {
//     console.log(`${subType}: ` + error.message);
//     let message = subType === OPERATIONS.SUBSCRIBE ? globals.subscribePostFailureMessage : globals.unSubscribePostFailureMessage;
//     return res.status(500).json({message: message});
//   });
// }

// updateUserHelper = async (req, subType, session) => {
//   return User.findOne(
//     { email: req.userData.email }).session(session)
//       .then(async (foundUser) => {
//         alreadySubscribed = foundUser.subscribedPosts.includes(req.body.postId);

//         switch(subType) {
//           case OPERATIONS.SUBSCRIBE:
//             if(!alreadySubscribed) {
//               foundUser.subscribedPosts.push(req.body.postId);
//             }
//             break;
//           case OPERATIONS.UNSUBCRIBE:
//             if(alreadySubscribed) {
//               index = foundUser.subscribedPosts.indexOf(req.body.postId)
//               if (index > -1) {
//                 foundUser.subscribedPosts.splice(index, 1);
//               }
//             }
//             break;
//           default:
//             // Nothing happens, shouldn't reach here anyway
//         }
//         // !!! HAS TO HAVE A WAIT OR IT WON'T ROLLBACK
//         await foundUser.save();
//       return foundUser;
//     });
// }

// updatePostHelper = async (req, userId, subType, session) => {
//   return Post.findById(
//     req.body.postId).session(session)
//       .then(async (foundPost) => {

//         alreadySubscribed = foundPost.subscribers.includes(userId);

//         switch(subType) {
//           case OPERATIONS.SUBSCRIBE:
//             if(!alreadySubscribed) {
//               foundPost.subscribers.push(userId);
//             }
//             break;
//           case OPERATIONS.UNSUBCRIBE:
//             if(alreadySubscribed) {
//               foundPost.subscribers = foundPost.subscribers.filter(item => item !== userId);
//             }
//             break;
//           default:
//         }
//         await foundPost.save();
//         return;
//     });
// }
