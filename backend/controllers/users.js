const User = require('../models/user');

exports.createUser = (req, res, next) => {
  const user = new User ({
    name: req.body.name,
    email: req.body.email
  });

  user.save().then(newUser => {
    console.log('User created successfully');
    return res.status(201).json({});
  })
  .catch(error => {
    console.log(error);
    return res.status(500).json({});
  });
}
