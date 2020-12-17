const express = require('express');
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const extractFile = require("../middleware/multer");
const TrackingController = require("../controllers/trackings");

router.get('/trackings/tracking-tool', checkAuth.isAuthenticated, TrackingController.getTrackingTool);

router.get('/trackings/search', checkAuth.isAuthenticated, TrackingController.fuzzySearch); // Has to be before get /:id

router.get('/trackings/:id', checkAuth.isAuthenticated, TrackingController.getTracking) // Get one

router.get('/trackings', checkAuth.isAuthenticated, TrackingController.getTrackings); // Get all

router.post('/trackings', checkAuth.isAuthenticated, extractFile.array("files[]"), TrackingController.createTracking); // Create

router.delete('/trackings/:id', checkAuth.isAuthenticated, TrackingController.deleteTracking); // delete

router.put('/trackings/:id', checkAuth.isAuthenticated, extractFile.array("files[]"), TrackingController.updateTracking); // Update

module.exports = router;
