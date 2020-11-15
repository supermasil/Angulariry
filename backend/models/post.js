const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const postSchema = mongoose.Schema({
  title: {type: String, required: true},
  content: {type: String, required: true},
  imagePath: {type: String, required: true},
  creator: {type: String, ref: 'User', required: true},
  subscribers: [{type: String, ref: 'User'}]
}, { timestamps: true });

postSchema.plugin(uniqueValidator); // Throw error if not unique
module.exports = mongoose.model('Post', postSchema);
