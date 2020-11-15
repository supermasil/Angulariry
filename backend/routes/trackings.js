const express = require('express');
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const extractFile = require("../middleware/multer");
const TrackingController = require("../controllers/trackings");

router.get('/tracking-tool', checkAuth.isAuthenticated, TrackingController.getTrackingTool);

router.post('', checkAuth.isAuthenticated, extractFile, TrackingController.createTracking);

router.get('', TrackingController.getTrackings);

router.get('/:id', TrackingController.getTracking)

router.delete('/:id', checkAuth.isAuthenticated, TrackingController.deleteTracking);

router.put('/:id', checkAuth.isAuthenticated, extractFile, TrackingController.updateTracking);

module.exports = router;
