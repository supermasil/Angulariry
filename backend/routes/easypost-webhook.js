const express = require('express');
const router = express.Router();
const easyPostController = require("../controllers/easypost-webhooks");

router.post('', easyPostController.updateTracker);

module.exports = router;
