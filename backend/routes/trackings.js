const express = require('express');
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const extractFile = require("../middleware/multer");
const TrackingController = require("../controllers/trackings");

router.get('/tracking-tool', checkAuth.isAuthenticated, TrackingController.getTrackingTool);

router.get('/search', checkAuth.isAuthenticated, TrackingController.fuzzySearch); // Has to be before get /:id

router.get('/:id', TrackingController.getTracking) // Get one

router.get('/', TrackingController.getTrackings); // Get all

router.post('/', checkAuth.isAuthenticated, TrackingController.createTracking); // Create

router.delete('/:id', checkAuth.isAuthenticated, TrackingController.deleteTracking); // delete

router.put('/:id', checkAuth.isAuthenticated, TrackingController.updateTracking); // Update

module.exports = router;
