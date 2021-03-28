const HistoryModel = require('../models/history');

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
      res.status(200).json(histories);
    });
  } catch (error) {
    console.log(`getHistories: ${error.message}`)
    return res.status(500).json({
      message: "Couldn't fetch histories"
    });
  }

}
