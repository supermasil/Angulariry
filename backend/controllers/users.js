const User = require('../models/user');

exports.createUser = (req, res, next) => {
  const user = new User ({
    _id: req.body.user.uid,
    name: req.body.name,
    email: req.body.user.email,
    phoneNumber: req.body.phoneNumber,
    role: req.body.role,
    companyCode: req.body.companyCode,
    customerCode: req.body.customerCode,
    addresses: [{address: req.body.address,
              addressLineTwo: req.body.addressLineTwo,
              addressUrl: req.body.addressUrl}]

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
      message: error.message
    });
  });
}

exports.getUser = async (req, res, next) => {
  try {
    foundUser = await this.getUserHelper(req.query.uid);
    return res.status(201).json({
      user: foundUser
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: "Couldn't find user"
    });
  }
}

exports.getUserHelper = async uid => {
  return await User.findById(uid)
    .then(foundUser => {
      return foundUser;
   })
}
