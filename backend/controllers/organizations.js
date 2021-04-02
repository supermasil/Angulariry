const OrganizationModel = require('../models/organization');
const PricingModel = require('../models/pricing');
const db = require('mongoose');
let assert = require('assert');
const app = require("../app");

exports.createUpdateOrganization = async (req, res, next) => {
  try {
    let updatedOrg = null;
    const session = await db.startSession();
    await session.withTransaction(async () => {
      let org = null;

      if (req.body._id && req.userData.u_id) { // edit
        org = await this.getOrganizationByIdHelper(req.body._id);
      } else { // create
        org = new OrganizationModel();
        const pricing = await PricingModel.create([{
          organization: org._id,
          items: []
        }], {session: session}).then(response => response[0]);

        org.pricings = pricing._id;
      }

      org.email = req.body.email;
      org.name =  req.body.name;
      org.insuranceOptions = req.body.insuranceOptions;
      org.locations = locationsSetupHelper(req.body.locations);
      let registerCode = randomString(5);

      while ((await getOrganizationByRegisterCodeHelper(registerCode)) != null) {
        app.logger.error("createUpdateOrganization: registerCode is duplicate")
        registerCode = randomString(5);
      }

      org.registerCode = registerCode;

      if (req.body._id && req.userData.u_id) {
        updatedOrg = await OrganizationModel.findByIdAndUpdate(org._id, org, {new: true}).session(session).then(response => {
          return response;
        });
      } else {
        updatedOrg = await OrganizationModel.create([org], {session: session}).then(response => {
          return response[0];
        });
      }
      return next({
        resCode: 200,
        resBody: {
          message: "creation-success",
          organization: updatedOrg
        }
      });
    });
  } catch(error) {
    app.logger.error(`createUpdateOrganization: ${req.body.name}: ${error.message}`);
    return next({
      error: error
    })
  };
}

locationsSetupHelper = (locations) => {
  results = [];
  locations.forEach(item =>{
    results.push({
      name: item.name,
      phoneNumber: item.phoneNumber,
      faxNumber: item.faxNumber,
      address: {
        address: item.address,
        addressLineTwo: item.addressLineTwo,
        addressUrl: item.addressUrl
      },
      operatingHours: item.operatingHours, //hh:mm:ss - hh:mm:ss
      operatingDays: item.operatingDays // Mon, Tues ....
    });
  });

  return results;
}

exports.getOrganization = async (req, res, next) => {
  try {
    foundOrganization = await this.getOrganizationByIdHelper(req.params.id);
    if (foundOrganization == null) {
      throw new Error("Organization is null");
    }
    return next({
      resCode: 200,
      resBody: foundOrganization
    });
  } catch (error) {
    return next({
      error: error
    })
  }
}

exports.getOrganizations = async (req, res, next) => {
  try {
    const orgQuery = OrganizationModel.find();
    const pageSize = req.query.pageSize? +req.query.pageSize : 5; // Convert to int
    const currentPage = req.query.currentPage? +req.query.currentPage : 0;
    if (pageSize && currentPage) {
      orgQuery
        .skip(pageSize * (currentPage))
        .limit(pageSize);
    }
    orgQuery.sort({createdAt: -1});

    return await orgQuery
      .then(documents => {
        fetchedOrgs = documents
        return orgQuery.countDocuments();
      })
      .then(count => {
        return next({
          resCode: 200,
          resBody: {
            organizations: fetchedOrgs,
            count: count
          }
        });
      });
  } catch(error) {
    return next({
      error: error
    });
  };
}

exports.getManyOrganizations = async (req, res, next) => {
  try {
    const orgQuery = OrganizationModel.find({ _id: { "$in" : req.body.orgIds} });
    await orgQuery
      .then(documents => {
        return next({
          resCode: 200,
          resBody: documents
        });
      });
  } catch(error) {
    return next({
      error: error
    });
  };
}

exports.getOrganizationByIdHelper = async (orgId) => {
  return await OrganizationModel.findById(orgId).then(foundOrganization => {
    return foundOrganization;
  });
}

getOrganizationByRegisterCodeHelper = async (code) => {
  return await OrganizationModel.findOne({registerCode: code}).then(foundOrganization => {
    return foundOrganization;
  });
}

exports.getOrganizationByRegisterCodeHelper = getOrganizationByRegisterCodeHelper;

exports.deleteOrganization = async (req, res, next) => {
  try {
    const session = await db.startSession();
    await session.withTransaction(async () => {
      await PricingModel.findByIdAndDelete(req, req.params.pricingId).then(response => {});
      await OrganizationModel.findByIdAndDelete(req.params.orgId).then(response => {});
      return next({
        resCode: 200,
        resBody: {message: "deletion-success"}
      });
    });
  } catch (error) {
    return next({
      error: error
    });
  }
}

exports.updateRegisterCode = async (req, res, next) => {
  await OrganizationModel.findById(req.params.id).then(async foundOrg => {
    assert(foundOrg != null, "updateRegisterCode: foundOrg is null");
    foundOrg.registerCode = randomString(8);
    await foundOrg.save();
    return next({
      resCode: 200,
      resBody: {message: "update-success"}
    });
  }).catch(error => {
    return next({
      error: error
    })
  })
}

randomString = (length) => {
  let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = '';
  for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
  return result.trim();
}
