const express = require('express');
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const SubscriptionController = require("../controllers/subscriptions");
const { route } = require('./users');

router.post('/subscribe', checkAuth.isAuthenticated, SubscriptionController.subscribePost);

router.post('/unsubscribe', checkAuth.isAuthenticated, SubscriptionController.unSubscribePost);

router.get('', checkAuth.isAuthenticated, SubscriptionController.getSubscribedPosts);

module.exports = router;
