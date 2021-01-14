const express = require('express');
const router = express.Router();
const OrganizationController = require("../controllers/organizations");
const checkAuth = require("../middleware/check-auth");

router.post('/', OrganizationController.createUpdateOrganization);

router.get('/:id', OrganizationController.getOrganization) // Get one

router.get('/', OrganizationController.getOrganizations); // Get All

router.delete('/:id', OrganizationController.deleteOrganization);

router.put('/:id', OrganizationController.createUpdateOrganization);

module.exports = router;
