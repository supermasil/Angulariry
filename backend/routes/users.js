const express = require('express');
const router = express.Router();
const UserController = require("../controllers/users");
const checkAuth = require("../middleware/check-auth");

router.post('/', UserController.createUpdateUser);

// router.get('/byOrg/:id', checkAuth.isAuthenticated, UserController.getUsersByOrgId) // Get one

router.get('/:id', checkAuth.isAuthenticated, UserController.getUser) // Get one

router.get('/', checkAuth.isAuthenticated, UserController.getUsers); // Get All

// router.delete('/:id', UserController.deleteUser);

router.put('/updateRole/:id', checkAuth.isAuthenticated, UserController.updateUserRole);

router.put('/updateOrg/:id', checkAuth.isAuthenticated, UserController.updateUserCurrentOrg);

router.post('/onboardToOrg/:id', checkAuth.isAuthenticated, UserController.onBoardUserToOrg);

router.put('/updateCredit/:id', checkAuth.isAuthenticated, UserController.updateUserCredit);

module.exports = router;
