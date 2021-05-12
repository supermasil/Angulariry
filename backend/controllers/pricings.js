let assert = require('assert');
const PricingModel = require('../models/pricing');
const app = require("../app");

exports.addItems = async (req, res, next) => {
  try {
    const pricing = await this.getPricingByIdHelper(req.body._id, req.userData.orgId);
    // console.log(JSON.stringify(req.body.items, null, 2));
    let currentItemNames = pricing.items.map(item => item.name);
    let toBeaddedItems = [];
    req.body.items.forEach(item => {
      if (!currentItemNames.includes(item.name)) {
        toBeaddedItems.push(item);
      }
    })

    toBeaddedItems = itemsSetupHelper(toBeaddedItems, true); // Remove the _id=null fields

    return await PricingModel.findByIdAndUpdate(
      req.body._id,
      {$push:
        {items:
          {$each: toBeaddedItems}
        }
      }, {new: true}).then(response => {
        return next({
          resCode: 200,
          resBody: {
            message: "creation-success",
            pricing: response
          }
        });
    });
  } catch(error) {
    return next({
      error: error
    });
  };
}

exports.updateItem = async (req, res, next) => {
  try {
    const pricing = await this.getPricingByIdHelper(req.body._id, req.userData.orgId);
    let index = pricing.items.findIndex(item => item._id == req.body.items[0]._id);
    assert(index > -1, "updateItems: Index not found")
    pricing.items[index] = req.body.items[0];

    return await pricing.save().then(response => {
      return next({
        resCode: 200,
        resBody: {
          message: "update-success",
          pricing: response
          }
      });
    })
  } catch(error) {
    return next({
      error: error
    })
  };
}

itemsSetupHelper = (items, createMode) => {
  results = [];
  items.forEach(item => {
    routesResults = [];
    item.routes.forEach(route => {
      destinationsResults = [];
      route.destinations.forEach(destination => {
        discountResults = [];
        destination.discounts.forEach(discount => {
          discountResults.push({
            userId: discount.userId,
            perUnitDiscountUnit: discount.perUnitDiscountUnit,
            perUnitDiscountAmount: discount.perUnitDiscountAmount,
            extraChargeDiscountUnit: discount.extraChargeDiscountUnit,
            extraChargeDiscountAmount: discount.extraChargeDiscountAmount,
          })
        });

        destination = {
          _id: destination._id,
          name: destination.name,
          pricePerUnit: destination.pricePerUnit,
          extraCharge: destination.extraCharge,
          extraChargeUnit: destination.extraChargeUnit,
          discounts: discountResults
        }

        if (createMode) {
          delete destination._id;
        }

        destinationsResults.push(destination);
      });

      route = {
        _id: route._id,
        origin: route.origin,
        destinations: destinationsResults
      }

      if (createMode) {
        delete route._id;
      }

      routesResults.push(route)
    });

    item = {
      _id: item._id,
      name: item.name,
      unit: item.unit,
      content: item.content,
      routes: routesResults
    }

    if (createMode) {
      delete item._id;
    }

    results.push(item);
  });
  return results;
}

exports.getPricing = async (req, res, next) => {
  try {
    foundPricing = await this.getPricingByIdHelper(req.params.id, req.userData.orgId);
    if (foundPricing == null) {
      throw new Error("Pricing is null");
    }
    return next({
      resCode: 200,
      resBody: foundPricing
    });
  } catch (error) {
    return next({
      error: error
    })
  }
}

// exports.getPricings = async (req, res, next) => {
//   try {
//     const pricingQuery = PricingModel.find();
//     const pageSize = req.query.pageSize? +req.query.pageSize : 5; // Convert to int
//     const currentPage = req.query.currentPage? +req.query.currentPage : 0;

//     if (pageSize && currentPage) {
//       pricingQuery
//         .skip(pageSize * (currentPage))
//         .limit(pageSize);
//     }
//     pricingQuery.sort({createdAt: -1});

//     return await pricingQuery
//       .then(documents => {
//         fetchedPricings = documents
//         return pricingQuery.countDocuments();
//       })
//       .then(count => {
//         return res.status(200).json({
//           // No error message needed
//           pricings: fetchedPricings,
//           count: count
//         });
//       })
//   } catch(error) {
//     console.log(`getPricings: ${error.message}`);
//     return res.status(500).json({
//       message: "Couldn't fetch pricings"
//     });
//   };
// }

// exports.deletePricings = async (req, res, next) => {
//   try {
//     await PricingModel.findByIdAndDelete(req.params.id);
//     return res.status(200).json({
//       message: "Pricing deleted successfully"
//     });
//   } catch (error) {
//     console.log(`deletePricings: ${req.params.id}: ${error.message}`);
//     return res.status(500).json({
//       message: "Couldn't delete pricings"
//     });
//   }
// }

exports.deleteItem = async (req, res, next) => {
  try {
    const pricing = await this.getPricingByIdHelper(req.params.pricingId, req.userData.orgId);
    let tempItems = pricing.items.filter(i => i._id != req.params.itemId);
    pricing.items = tempItems;

    await pricing.save().then(response => {});
    return next({
      resCode: 200,
      resBody: {
        message: "deletion-success"
      }
    });
  } catch (error) {
    return next({
      error: error
    })
  }
}

exports.deletePricing = async (req, res, next) => {
  try {
    await PricingModel.findByIdAndDelete(req._id).then(response => {});
    return next({
      resCode: 200,
      resBody: {
        message: "deletion-success"
      }
    });
  } catch (error) {
    return next({
      error: error
    })
  }
}

exports.cleanUpPricing = async (req, res, next) => {
  try {
    const pricing = await this.getPricingByIdHelper(req.params.id, req.userData.orgId);
    pricing.items = [];

    await pricing.save().then(response => {});
    return next({
      resCode: 200,
      resBody: {
        message: "deletion-success"
      }
    });
  } catch (error) {
    return next({
      error: error
    })
  }
}

exports.getPricingByIdHelper = async (pricingId, orgId) => {
  return await PricingModel.findOne({_id: pricingId, organization: orgId}).then(foundPricing => {
    return foundPricing;
  });
}
