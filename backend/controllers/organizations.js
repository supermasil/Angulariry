const OrganizationModel = require('../models/organization');
const PricingModel = require('../models/pricing');
const db = require('mongoose');

exports.createUpdateOrganization = async (req, res, next) => {
  try {
    const session = await db.startSession();
    await session.withTransaction(async () => {
      let org = null;

      if (req.body._id && req.body.userData.uid) { // edit
        org = await this.getOrganizationByIdHelper(req.body._id);
      } else { // create
        org = new OrganizationModel();
      }

      org.email = req.body.email;
      org.name =  req.body.name;
      org.companyCode = req.body.companyCode;
      org.insuranceOptions = req.body.insuranceOptions;
      org.locations = locationsSetupHelper(req.body.locations);

      const pricing = await PricingModel.create([{
        organization: org._id,
        items: []
      }], {session: session}).then(response => response[0]);

      org.pricings = pricing._id;

      await org.validate();

      await OrganizationModel.create([org], {session: session}).then(response => {
        return res.status(201).json({
          message: "Organization created/updated successfully",
          organization: response[0]
        });
      });
    });
  } catch(error) {
    console.log(`createUpdateOrganization: ${req.body.companyCode}: ${error.message}`);
    return res.status(500).json({
      message: "Organization creation/update failed"
    });
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
    return res.status(200).json(foundOrganization);
  } catch (error) {
    console.log(`getOrganization: ${req.params.id}: ${error.message}`);
    return res.status(500).json({
      message: "Couldn't find organization"
    });
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
        return res.status(200).json({
          // No error message needed
          organizations: fetchedOrgs,
          count: count
        });
      })
  } catch(error) {
    console.log(`getOrganizations: ${error.message}`);
    return res.status(500).json({
      message: "Couldn't fetch organizations"
    });
  };
}

exports.getOrganizationByIdHelper = async (orgId) => {
  return await OrganizationModel.findById(orgId).then(foundOrganization => {
    return foundOrganization;
  });
}

exports.getOrganizationByCodeHelper = async (companyCode) => {
  return await OrganizationModel.findOne({companyCode: companyCode}). then(foundOrganization => {
    return foundOrganization;
  });
}

exports.deleteOrganization = async (req, res, next) => {
  try {
    const session = await db.startSession();
    await session.withTransaction(async () => {
      await PricingModel.findByIdAndDelete(req, req.params.pricingId).then(response => {});
      await OrganizationModel.findByIdAndDelete(req.params.orgId).then(response => {});

      return res.status(200).json({
        message: "Oganization deleted successfully"
      });
    });
  } catch (error) {
    console.log(`deleteOrganization: ${req.params.id}: ${error.message}`);
    return res.status(500).json({
      message: "Couldn't delete organization"
    });
  }
}
