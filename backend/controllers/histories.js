const HistoryModel = require('../models/history');
const app = require("../app");

exports.createHistoryHelper = async (userId, orgId, action, postId, session) => {
  return await HistoryModel.create([{
    userId: userId,
    action: action,
    postId: postId,
    organization: orgId
  }], {session: session}).then(history => {return history[0]});
}

exports.getHistories = async (req, res, next) => {
  try {
    historyList = req.params.ids.split(",");
    return await HistoryModel.find({_id: {$in: historyList}, organization: req.userData.orgId}).sort({createdAt: -1}).then(histories => {
      return next({
        resCode: 200,
        resBody: histories
      });
    });
  } catch (error) {
    return next({
      error: error
    })
  }

}
