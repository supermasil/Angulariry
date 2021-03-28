const express = require('express');
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const HistoryController = require("../controllers/histories");

router.get('/:ids', checkAuth.isAuthenticated, HistoryController.getHistories);

module.exports = router;
