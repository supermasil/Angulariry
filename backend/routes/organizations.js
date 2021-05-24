const express = require('express');
const router = express.Router();
const OrganizationController = require("../controllers/organizations");
const checkAuth = require("../middleware/check-auth");

router.post('/', checkAuth.isAuthenticated, OrganizationController.createUpdateOrganization);

router.get('/orgs/:ids', OrganizationController.getOrganizationsByIds) // Get one

router.get('/', checkAuth.isAuthenticated, OrganizationController.getOrganizations); // Get All

router.delete('/:id', checkAuth.isAuthenticated, OrganizationController.deleteOrganization);

router.put('/:id', checkAuth.isAuthenticated, OrganizationController.createUpdateOrganization);

module.exports = router;
