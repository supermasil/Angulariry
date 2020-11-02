const mongoose = require('mongoose');
const { subscribe } = require('../routes/users');

const postSchema = mongoose.Schema({
  title: {type: String, required: true},
  content: {type: String, required: true},
  imagePath: {type: String, required: true},
  creator: {type: String, required: true},
  subscribers: [{type: mongoose.Types.ObjectId, ref: 'User'}]
});

module.exports = mongoose.model('Post', postSchema);
