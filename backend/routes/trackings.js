const express = require('express');
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const TrackingController = require("../controllers/trackings");

router.get('', checkAuth.isAuthenticated, TrackingController.getTrackingInfo);

module.exports = router;
