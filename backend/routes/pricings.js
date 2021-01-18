const express = require('express');
const router = express.Router();
const PricingController = require("../controllers/pricings");
const checkAuth = require("../middleware/check-auth");

router.post('/', checkAuth.isAuthenticated, PricingController.addItems);

router.get('/:id', checkAuth.isAuthenticated, PricingController.getPricing); // Get one

router.put('/:id', checkAuth.isAuthenticated, PricingController.updateItems);

router.delete('/:pricingId/item/:itemId', checkAuth.isAuthenticated, PricingController.deleteItem);

router.delete('/:id', checkAuth.isAuthenticated, PricingController.deletePricing);

router.delete('/cleanup/:id', PricingController.cleanUpPricing)
module.exports = router;
