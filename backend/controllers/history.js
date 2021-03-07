const HistoryModel = require('../models/history');

exports.createHistoryHelper = async (userId, orgId, action, postId, session) => {
  return await HistoryModel.create([{
    userId: userId,
    action: action,
    postId: postId,
    organization: orgId
  }], {session: session}).then(history => {return history[0]});
}
