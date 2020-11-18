const User = require('../models/user');

exports.createUser = (req, res, next) => {
  const user = new User ({
    _id: req.body.user.uid,
    name: req.body.name,
    email: req.body.user.email,
    isAdmin: false
  });

  user.save().then(newUser => {
    return res.status(201).json({
      message: "User created successfully",
    });
  })
  .catch(error => {
    console.log(error.message);
    return res.status(500).json({
      message: "User couldn't be created"
    });
  });
}
