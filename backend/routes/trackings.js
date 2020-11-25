const express = require('express');
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const extractFile = require("../middleware/multer");
const TrackingController = require("../controllers/trackings");

router.get('/tracking-tool', checkAuth.isAuthenticated, TrackingController.getTrackingTool);

router.get('/search', TrackingController.fuzzySearch); // Has to be before get /:id

router.get('/:id', TrackingController.getTracking)

router.get('', TrackingController.getTrackings);

router.post('', checkAuth.isAuthenticated, extractFile.array("files[]"), TrackingController.createTracking);

router.delete('/:id', checkAuth.isAuthenticated, TrackingController.deleteTracking);

router.put('/:id', checkAuth.isAuthenticated, extractFile.array("files[]"), TrackingController.updateTracking);

module.exports = router;
