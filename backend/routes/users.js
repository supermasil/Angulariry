const express = require('express');
const router = express.Router();
const UserController = require("../controllers/users");
const checkAuth = require("../middleware/check-auth");

router.post('/signup', UserController.createUser);

router.get('/getuser', checkAuth.isAuthenticated, UserController.getUser);

module.exports = router;
