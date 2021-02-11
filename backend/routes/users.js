const express = require('express');
const router = express.Router();
const UserController = require("../controllers/users");
const checkAuth = require("../middleware/check-auth");

router.post('/', checkAuth.isAuthenticated, UserController.createUpdateUser);

// router.get('/byOrg/:id', checkAuth.isAuthenticated, UserController.getUsersByOrgId) // Get one

router.get('/:id', checkAuth.isAuthenticated, UserController.getUser) // Get one

router.get('/', checkAuth.isAuthenticated, UserController.getUsers); // Get All

// router.delete('/:id', UserController.deleteUser);

router.put('/:id', checkAuth.isAuthenticated, UserController.createUpdateUser);

module.exports = router;
