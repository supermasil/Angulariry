const UserModel = require('../models/user');
const OrganizationController = require('./organizations');
const db = require('mongoose');
const admin = require('firebase-admin');
let assert = require('assert');
const HistoryController = require("./histories");
const app = require("../app");
const userTypes = {
  MONGO: 'mongo',
  FIREBASE: 'firebase'
}

// Messy af, can't use await on admin
exports.createUpdateUser = async (req, res, next) => {
  let firebaseUser = null;
  let updatedUser = null;

  try {
    const user = {
      name: req.body.name,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      addresses: addressesSetupHelper(req.body.addresses),
      recipients: recipientsSetupHelper(req.body.recipients)
    }

    if (!req.body._id) {
      let userCode = randomString(5);
      while ((await UserModel.findOne({'userCode': userCode}).then(foundUser => {return foundUser})) != null) {
        app.logger.warn(`createUpdateUser: userCode ${userCode} is duplicate`)
        userCode = randomString(5);
      }
      user['userCode'] = userCode;
      await admin
        .auth()
        .createUser({
          email: req.body.email,
          password: req.body.password,
        })
        .then(async userRecord => {
          app.logger.info('Successfully created new firebase user:', userRecord.uid);
          firebaseUser = userRecord;
          user['id'] = userRecord.uid;
          let createdUser = await UserModel.create(new UserModel(user)).then(async user => {
            return user;
            }).catch(async error => {
              app.logger.info(`createUpdateUser: ${req.body.email}: ${error.message}`);
              if (firebaseUser) {
                await deleteFireBaseUser(firebaseUser.uid).then(() => {
                  app.logger.info('Successfully deleted firebase user');
                  return next({
                    error: new Error(error.message.includes("`userCode`") ? "Customer code already exists" : "User creation/update failed"),
                    resCode: 500,
                    resBody: {message: error.message.includes("`userCode`") ? "customer-code-existed" : "something-went-wrong"}
                  });
                })
                .catch((error) => {
                  app.logger.error('Error deleting firebase user:', error);
                  return next({
                    error: error
                  });
                });
              } else {
                return next({
                  error: new Error(error.message.includes("`userCode`") ? "Customer code already exists" : "User creation/update failed"),
                  resCode: 500,
                  resBody: {message: error.message.includes("`userCode`") ? "customer-code-existed" : "something-went-wrong"}
                });
              }
            });

          app.logger.info('Successfully created new mongodb user:', createdUser._id);
          return next({
            resCode: 200,
            resBody: {
              message: "creation-success",
              user: createdUser
            }
          });
        })
      .catch((error) => {
        return next({
          error: error
        })
      });
      } else {
        await UserModel.findOneAndUpdate({_id: req.body._id}, {$set: user}, {new: true}).then(async user => {
          updatedUser = user;
          if (req.body.role) {
            updatedUser.organizations.filter(o => o.organization == req.userData.orgId)[0].role = req.body.role;
            await updatedUser.save();
          }
        });

        return next({
          resCode: 200,
          resBody: {
            message: "update-success",
            user: updatedUser
          }
        });
      }
  } catch(error) {
    app.logger.error(`createUpdateUser: ${req.body.email}: ${error.message}`);
    return next({
      error: error
    })
  };
}

getFireBaseUser = async (uid) => {
  return admin
  .auth()
  .getUser(uid)
  .then((userRecord) => {})
  .catch((error) => {
    app.logger.error('Error fetching user data:', error);
  });
}

deleteFireBaseUser = async (uid) => {
  await admin
  .auth()
  .deleteUser(uid);
}

addressesSetupHelper = (addresses) => {
  results = [];
  addresses.forEach(item =>{
    results.push({
        address: item.address,
        addressLineTwo: item.addressLineTwo,
        addressUrl: item.addressUrl
      });
  });
  return results;
}

recipientsSetupHelper = (recipients) => {
  results = [];
  recipients.forEach(item =>{
    results.push({
      name: item.name,
      email: item.email,
      phoneNumber: item.phoneNumber,
      address: {
        address: item.address,
        addressLineTwo: item.addressLineTwo,
        addressUrl: item.addressUrl
      }
    });
  });
  return results;
}

exports.getUsers = async (req, res, next) => {
  try {
    const userQuery = UserModel.find({"organizations.organization": req.userData.orgId}); // if organizations contains org id
    const pageSize = req.query.pageSize? +req.query.pageSize : 5; // Convert to int
    const currentPage = req.query.currentPage? +req.query.currentPage : 0;

    if (pageSize && currentPage) {
      userQuery
        .skip(pageSize * (currentPage))
        .limit(pageSize);
    }
    userQuery.sort({createdAt: -1});

    return await userQuery
      .populate("organization")
      .then(async users => {
        for (u of users) {
          await switchOverFields(u, u.organizations.filter(o => o.organization == req.userData.orgId)[0], true)
        }
        fetchedUsers = users
        return userQuery.countDocuments();
      })
      .then(count => {
        return next({
          resCode: 200,
          resBody: {
            // No error message needed
            users: fetchedUsers,
            count: count
          }
        });
      })
  } catch(error) {
    return next({
      error: error
    });
  };
}

exports.getUser = async (req, res, next) => {
  try {
    foundUser = await this.getUserByIdHelper(req.userData, req.params.id, req.query.type);
    return next({
      resCode: 200,
      resBody: foundUser
    });
  } catch (error) {
    app.logger.error(`getUser: ${req.params.id}: ${error.message}`);
    return next({
      error: error
    });
  }
}


getUserByIdHelper = async (userData, userId, type) => {  // Can't enfore orgId here since user is also enquired at authentication
  let queryParams = type == userTypes.FIREBASE ? {id: userId} : {_id: userId}; // First case is on login
  if (userData.u_id != userId && userData.orgId) { // User is requested by a different user
    queryParams["organizations.organization"] = userData.orgId;
  }

  let query = UserModel.findOne(queryParams).populate("organization");

  return await query.then(async foundUser => {
    if (foundUser == null) {
      throw new Error("getUserByIdHelper: User is null");
    }
    if (foundUser && userData.orgId) {
      let foundOrg = foundUser.organizations.filter(o => o.organization == userData.orgId)[0];
      await switchOverFields(foundUser, foundOrg, true);
    }
    return foundUser;
  });
}

exports.getUserByIdHelper = getUserByIdHelper;

getUserByUserCodeHelper = async (userCode, orgId) => {
  let query = UserModel.findOne({userCode: userCode, "organizations.organization" : orgId}).populate("organization");
  return await query.then(async foundUser => {
    if (foundUser) {
      await switchOverFields(foundUser, foundUser.organizations.filter(o => o.organization.toString() == orgId)[0], true);
      return foundUser;
    } else {
      return null;
    }
  });
}

switchOverFields = async (user, fields, populate) => {
  user.organization = populate ? await OrganizationController.getOrganizationByIdHelper(fields.organization) : fields.organization;
  user.role = fields.role;
  user.creatorId = fields.creatorId;
  user.credit = fields.credit;
  user.active = fields.active;
  user.creditHistory = fields.creditHistory;
}

exports.getUserByUserCodeHelper = getUserByUserCodeHelper;

exports.updateUserCurrentOrg = async (req, res, next) => {
  try {
    await UserModel.findById(req.params.id).then(async foundUser => {
      assert(foundUser.organizations.map(o => o.organization).includes(req.body.orgId), "You're not onboarded to this org");
      let org = foundUser.organizations.filter(o => o.organization == req.body.orgId)[0];
      let foundOrg = await OrganizationController.getOrganizationByIdHelper(req.body.orgId);
      assert(foundOrg != null, "updateUserCurrentOrg: Org is null");
      foundUser.pricings = foundOrg.pricings;
      await switchOverFields(foundUser, org, false);
      await foundUser.save();
      app.logger.info(`updateUserCurrentOrg: Logged user ${req.userData.u_id} to org ${foundOrg.name}`);
      return next({
        resCode: 200,
        resBody: {
          organization: foundOrg,
          user: foundUser
        }
      });
    })
  } catch (error) {
    app.logger.info(`updateUserCurrentOrg: ${error.message} for org ${req.body.orgId} and user id ${req.params.id}`)
    return next({
      error: error
    });
  }
}
exports.onBoardUserToOrg = async (req, res, next) => {
  let errorMessage = "Onboarding user to new org failed";
  try {
    let response = await onBoardUserToOrgHelper(req.params.id, req.body.registerCode, req.body.referralCode);
    return next({
      resCode: 200,
      resBody: {
        organization: response.organization,
        user: response.user
      }
    });
  } catch (error) {
    return next({
      error: error,
      resCode: 500,
      resBody: {message: error.message.includes("onBoardUserToOrgHelper") ? error.message.split(':')[2] : "something-went-wrong"}
    });
  }
}

onBoardUserToOrgHelper = async (u_id, registerCode, referralCode) => {
  try {
    return await UserModel.findById(u_id).then(async foundUser => {
      let org = await OrganizationController.getOrganizationByRegisterCodeHelper(registerCode);
      assert(org != null, "Org is null");
      let referrer = null;
      if (referralCode) {
        referrer = await getUserByUserCodeHelper(referralCode, org._id);
        if (referrer == null) {
          throw new Error("onBoardUserToOrgHelper: referrer-not-found");
        }
        assert(referrer.userCode != u_id, "onBoardUserToOrgHelper: referrer-same-as-user");
      }

      foundUser.organization = org._id;

      if (foundUser.organizations.map(o => o.organization).includes(org._id)) {
        throw new Error("onBoardUserToOrgHelper: already-onboarded");
      }

      foundUser.organizations.push({organization: org._id, role: foundUser.role === "SuperAdmin"? "SuperAdmin" : "Customer", credit: 0, creatorId: referrer? referrer._id : null, active: true, creditHistory: []});
      foundUser.organization = org._id
      foundUser.pricings = org.pricings;
      foundUser.role = foundUser.role === "SuperAdmin"? "SuperAdmin" : "Customer";
      foundUser.creatorId = referrer? referrer._id : null;
      foundUser.active = true;
      foundUser.creditHistory = [];
      foundUser = await UserModel.findByIdAndUpdate(foundUser._id, foundUser, {new: true}).then(updatedUser => {return updatedUser});
      app.logger.info(`onBoardUserToOrgHelper: Onboarded user ${u_id} to org ${org.name} referred by ${foundUser.creatorId}`);
      let response =  {
        organization: org,
        user: foundUser
      }
      return response;
    });
  } catch (error) {
    app.logger.info(`onBoardUserToOrgHelper: ${error.message} for register code ${registerCode} and referral code ${referralCode} and user id ${u_id}`);
    throw new Error(error);
  }
}

exports.updateUserCredit = async (req, res, next) => {
  try {
    const session = await db.startSession();
    await session.withTransaction(async () => {
      let currentUser = await UserModel.findById(req.userData.u_id).then(foundUser => {return foundUser});
      await UserModel.findById(req.params.id).then(async foundUser => {
        let history = (await HistoryController.createHistoryHelper(req.userData.u_id, req.userData.orgId, `${currentUser.name}: ${foundUser.name}: $${req.body.amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')} "${req.body.content}"`, req.params.id, session));
        foundUser.organizations.filter(o => o.organization == req.userData.orgId)[0].credit = req.body.amount;
        foundUser.organizations.filter(o => o.organization == req.userData.orgId)[0].creditHistory.unshift(history._id);
        let updatedUser = await UserModel.findByIdAndUpdate(req.params.id, foundUser).session(session).then(user => user);
        app.logger.info(`updateUserCredit: for user ${req.params.id} with amount ${req.body.amount} by user ${req.userData.u_id}`);
        return next({
          resCode: 200,
          resBody: {
            message: "update-success",
            user: updatedUser
          }
        });
      });
    });
  } catch (error) {
    app.logger.error(`updateUserCredit: for user ${req.params.id} with amount ${req.body.amount} by user ${req.userData.u_id}`, error.message)
    return next({
      error: error
    })
  }

}

randomString = (length) => {
  let chars = '0123456789'
  let result = '';
  for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
  return result.trim();
}
