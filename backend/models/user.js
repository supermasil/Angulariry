const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true }, // unique doesn't not throw error if not unique
  password: { type: String, required: true }
});

userSchema.plugin(uniqueValidator); // Throw error if not unique

module.exports = mongoose.model('User', userSchema);
