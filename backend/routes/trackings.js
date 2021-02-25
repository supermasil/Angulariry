const express = require('express');
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const TrackingController = require("../controllers/trackings");

router.get('/tracking-tool', checkAuth.isAuthenticated, TrackingController.getTrackingTool);

router.get('/search', checkAuth.isAuthenticated, TrackingController.fuzzySearch); // Has to be before get /:id

router.get('/:id', checkAuth.isAuthenticated, TrackingController.getTracking) // Get one

router.get('/', checkAuth.isAuthenticated, TrackingController.getTrackings); // Get all

router.post('/changeStatus', checkAuth.isAuthenticated, TrackingController.changeTrackingStatus); // Create

router.post('/', checkAuth.isAuthenticated, TrackingController.createUpdateTracking); // Create

router.delete('/:id', checkAuth.isAuthenticated, TrackingController.deleteTracking); // delete

module.exports = router;
