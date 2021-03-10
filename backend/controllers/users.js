const UserModel = require('../models/user');
const OrganizationController = require('./organizations');
const db = require('mongoose');
const admin = require('firebase-admin');
let assert = require('assert');
const HistoryController = require("../controllers/history");
const { response } = require('express');
const { use } = require('../routes/users');


// Messy af, can't use await on admin
exports.createUpdateUser = async (req, res, next) => {
  let firebaseUser = null;
  try {
  const user = new UserModel();;
  user.name = req.body.name;
  user.email = req.body.email;
  user.phoneNumber = req.body.phoneNumber;
  user.addresses = addressesSetupHelper(req.body.addresses);
  user.recipients = recipientsSetupHelper(req.body.recipients);

  let updatedUser = null;
  if (!req.body.id) {
    let userCode = randomString(5);
    while ((await UserModel.findOne({'userCode': userCode}).then(foundUser => {return foundUser})) != null) {
      console.log(`createUpdateUser: userCode ${userCode} is duplicate`)
      userCode = randomString(5);
    }
    user.userCode = userCode;

    await admin
      .auth()
      .createUser({
        email: req.body.email,
        password: req.body.password,
      })
      .then(async userRecord => {
        console.log('Successfully created new firebase user:', userRecord.uid);
        firebaseUser = userRecord;
        user.id = userRecord.uid;
        let createdUser = await UserModel.create(user).then(async user => {
          return user;
        }).catch(async error => {
          console.log(`createUpdateUser: ${req.body.email}: ${error.message}`);
          if (firebaseUser) {
            await deleteFireBaseUser(firebaseUser.uid).then(() => {
              console.log('Successfully deleted firebase user');
              return res.status(500).json({
                message: error.message.includes("`userCode`") ? "Customer code already exists" : "User creation/update failed"
              });
            })
            .catch((error) => {
              console.log('Error deleting firebase user:', error);
              return res.status(500).json({
                message: "User creation/update failed"
              });
            });
          } else {
            return res.status(500).json({
              message: error.message.includes("`userCode`") ? "Customer code already exists" : "User creation/update failed"
            });
          }
        });

        console.log('Successfully created new mongodb user:', createdUser.id);
        return res.status(201).json({
          message: "User created successfully",
          user: createdUser
        });;
      })
      .catch((error) => {
        console.log('Error creating new firebase user:', error.message);
        return res.status(500).json({
          message: error.message
        });
      });
    } else {
      await UserModel.findOneAndUpdate({id: req.body.id}, {$set: {
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        addresses: user.addresses,
        recipients: user.recipients
      }}, {new: true}).then(async user => {
        updatedUser = user;
        if (req.body.role) {
          updatedUser.organizations.filter(o => o.organization == req.userData.orgId)[0].role = req.body.role;
          await updatedUser.save();
        }
      });
      return res.status(201).json({
        message: "User updated successfully",
        user: updatedUser
      });
    }
  } catch(error) {
    console.log(`createUpdateUser: ${req.body.email}: ${error.message}`);
    return res.status(500).json({
      message: "User creation/update failed"
    });
  };
}

getFireBaseUser = async (uid) => {
  return admin
  .auth()
  .getUser(uid)
  .then((userRecord) => {
    console.log(`Successfully fetched user data: ${userRecord.toJSON()}`);
  })
  .catch((error) => {
    console.log('Error fetching user data:', error);
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
        return res.status(200).json({
          // No error message needed
          users: fetchedUsers,
          count: count
        });
      })
  } catch(error) {
    console.log(`getUsers: ${error.message}`);
    return res.status(500).json({
      message: "Couldn't fetch users"
    });
  };
}

exports.getUser = async (req, res, next) => {
  try {
    foundUser = await this.getUserByIdHelper(req, req.params.id);
    if (foundUser == null) {
      throw new Error("User is null");
    }
    return res.status(200).json(foundUser);
  } catch (error) {
    console.log(`getUser: ${req.params.id}: ${error.message}`);
    return res.status(404).json({
      message: "Couldn't find user"
    });
  }
}


getUserByIdHelper = async (userData, userId) => {  // Can't enfore orgId here since user is enquired at authentication
  let queryParams = (!userData.uid && !userData.u_id && userId)?  {id: userId} : {_id: userId}; // First case is on login

  if (userData.u_id != userId && userData.orgId) { // User is requested by a different user
    queryParams["organizations.organization"] = userData.orgId;
  }

  let query = UserModel.findOne(queryParams).populate("organization");

  return await query.then(async foundUser => {
    if (foundUser && userData.orgId && foundUser.organization._id != userData.orgId) { // When the user is logged in to another org than the requester
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
      console.log(`updateUserCurrentOrg: Logged user ${req.userData.u_id} to org ${foundOrg.name}`);
      return res.status(200).json({
        organization: foundOrg,
        user: foundUser
      })
    })
  } catch (error) {
    console.log(`updateUserCurrentOrg: ${error.message} for org ${req.body.orgId} and user id ${req.params.id}`)
    return res.status(500).json({
      message: "Logged in to org failed"
    })
  }
}
exports.onBoardUserToOrg = async (req, res, next) => {
  let errorMessage = "Onboarding user to new org failed";
  try {
    let response = await onBoardUserToOrgHelper(req.params.id, req.body.registerCode, req.body.referralCode);
    return res.status(200).json({
      organization: response.organization,
      user: response.user
    })
  } catch (error) {
    return res.status(500).json({
      message: error.message.includes("onBoardUserToOrgHelper") ? error.message.split(':')[2] : errorMessage
    })
  }
}

onBoardUserToOrgHelper = async (u_id, registerCode, referralCode) => {
  try {
    return await UserModel.findById(u_id).then(async foundUser => {
      let org = await OrganizationController.getOrganizationByRegisterCodeHelper(registerCode);
      assert(org != null, "Org is null");
      let referrer = null;
      if (referralCode) {
        console.log(referralCode)
        referrer = await getUserByUserCodeHelper(referralCode, org._id);
        if (referrer == null) {
          throw new Error("onBoardUserToOrgHelper: Couldn't find referrer");
        }
        assert(referrer.userCode != u_id, "onBoardUserToOrgHelper: Referrer can't be the same as user");
      }

      foundUser.organization = org._id;

      if (foundUser.organizations.map(o => o.organization).includes(org._id)) {
        throw new Error("onBoardUserToOrgHelper: Already onboarded to this org");
      }

      foundUser.organizations.push({organization: org._id, role: foundUser.role === "SuperAdmin"? "SuperAdmin" : "Customer", credit: 0, creatorId: referrer? referrer.id : null, active: true});
      foundUser.organization = org._id
      foundUser.pricings = org.pricings;
      foundUser.role = "Customer"
      foundUser.creatorId = referrer? referrer.id : null;
      foundUser.active = true;
      foundUser = await UserModel.findOneAndUpdate({id: foundUser.id}, foundUser, {new: true}).then(updatedUser => {return updatedUser});
      console.log(`onBoardUserToOrgHelper: Onboarded user ${u_id} to org ${org.name} referred by ${foundUser.creatorId}`);
      let response =  {
        organization: org,
        user: foundUser
      }
      return response;
    });
  } catch (error) {
    console.log(`onBoardUserToOrgHelper: ${error.message} for register code ${registerCode} and referral code ${referralCode} and user id ${u_id}`);
    throw new Error(error);
  }
}

exports.updateUserCredit = async (req, res, next) => {
  try {
    const session = await db.startSession();
    await session.withTransaction(async () => {
      let currentUser = await UserModel.findById(req.userData.u_id).then(foundUser => {return foundUser});
      await UserModel.findById(req.params.id).then(async foundUser => {
        let history = (await HistoryController.createHistoryHelper(req.userData.u_id, req.userData.orgId, `${currentUser.name} updated ${foundUser.name}'s credit to $${req.body.amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')} with note: \"${req.body.content}\"`, req.params.id, session));
        foundUser.organizations.filter(o => o.organization == req.userData.orgId)[0].credit = req.body.amount;
        foundUser.creditHistory.unshift(history._id);
        await UserModel.findOneAndUpdate({id: req.params.id}, foundUser).session(session).then();
        console.log(`updateUserCredit: for user ${req.params.id} with amount ${req.body.amount} by user ${req.userData.u_id}`)
      });

      return res.status(200).json({
        message: "Updated credit successfully"
      })
    });
  } catch (error) {
    console.log(`updateUserCredit: for user ${req.params.id} with amount ${req.body.amount} by user ${req.userData.u_id}`, error.message)
    return res.status(500).json({
      message: "Credit update failed"
    })
  }

}

randomString = (length) => {
  let chars = '0123456789'
  let result = '';
  for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
  return result.trim();
}

// exports.deleteUser = async (req, res, next) => {
//   try {
//     await UserModel.findOneAndDelete({id: req.params.id});
//     return res.status(200).json({
//       message: "User deleted successfully"
//     });
//   } catch (error) {
//     console.log(`deleteUser: ${req.params.id}: ${error.message}`);
//     return res.status(500).json({
//       message: "Couldn't delete user"
//     });
//   }
// }
