const User = require('../models/user');

exports.createUser = (req, res, next) => {
  const user = new User ({
    _id: req.body.user.uid,
    name: req.body.name,
    email: req.body.user.email,
    phoneNumber: req.body.phoneNumber,
    role: req.body.role,
    companyCode: req.body.companyCode
  });

  user.save().then(newUser => {
    return res.status(201).json({
      message: "User created successfully",
      user: newUser
    });
  })
  .catch(error => {
    console.log(error.message);
    return res.status(500).json({
      message: "User creation failed"
    });
  });
}

exports.getUser = (req, res, next) => {
   User.findById(req.query.uid)
    .then(foundUser => {
      return res.status(201).json({
        user: foundUser
      });
   })
   .catch(error => {
    console.log(error.message);
    return res.status(500).json({
      message: "Couldn't find user"
    });
   })
}
