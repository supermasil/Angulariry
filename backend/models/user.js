const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = mongoose.Schema({
  name: {type: String, required: true },
  email: { type: String, required: true, unique: true }, // unique doesn't not throw error if not unique
  subscribedPosts: [{ type: mongoose.Types.ObjectId, ref: 'Post' }]
});

userSchema.plugin(uniqueValidator); // Throw error if not unique

module.exports = mongoose.model('User', userSchema);
