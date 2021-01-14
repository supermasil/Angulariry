const express = require('express');
const router = express.Router();
const UserController = require("../controllers/users");
const checkAuth = require("../middleware/check-auth");

router.post('/', UserController.createUpdateUser);

router.get('/byOrg/:id', UserController.getUsersByOrgId) // Get one

router.get('/:id', UserController.getUser) // Get one

router.get('/', UserController.getUsers); // Get All

// router.delete('/:id', UserController.deleteUser);

router.put('/:id', UserController.createUpdateUser);

module.exports = router;
