const UserModel = require('../models/user');
const OrganizationController = require('./organizations');
const db = require('mongoose');
const admin = require('firebase-admin');
let assert = require('assert');
const user = require('../models/user');


// Messy af, can't use await on admin
exports.createUpdateUser = async (req, res, next) => {
  let firebaseUser = null;
  const session = await db.startSession();
  await session.withTransaction(async () => {
    try {
    const user = new UserModel();;
    user.name = req.body.name;
    user.email = req.body.email;
    user.phoneNumber = req.body.phoneNumber;
    user.addresses = addressesSetupHelper(req.body.addresses);
    user.recipients = recipientsSetupHelper(req.body.recipients);
    if (req.userData) {
      user.creatorId = req.userData.uid;
    }

    let userCode = randomString(5);
    while ((await UserModel.findOne({'userCode': userCode}).then(foundUser => {return foundUser})) != null) {
      console.log("createUpdateUser: userCode is duplicate")
      userCode = randomString(5);
    }

    user.userCode = userCode;

    let updatedUser = null;
    if (!req.body._id) {
      await admin
        .auth()
        .createUser({
          email: req.body.email,
          password: req.body.password,
        })
        .then(async userRecord => {
          console.log('Successfully created new firebase user:', userRecord.uid);
          firebaseUser = userRecord;
          user._id = userRecord.uid;
          await UserModel.create([user], {session: session}).then(users => {
            updatedUser = users[0];
            return res.status(201).json({
              message: "User created successfully",
              user: updatedUser
            });
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
        })
        .catch((error) => {
          console.log('Error creating new firebase user:', error.message);
          return res.status(500).json({
            message: error.message
          });
        });
      } else {
        let userCopy = user.toObject();
        delete userCopy.organization; delete userCopy.organizations; delete userCopy.pricings;
        await UserModel.findByIdAndUpdate(req.body._id, {$set: userCopy}, {new: true}).session(session).then(user => {
          updatedUser = user;
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
  });
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

exports.getUser = async (req, res, next) => {
  try {
    foundUser = await this.getUserByIdHelper(req.userData.uid, req.params.id, req.userData.orgId);
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
      .then(documents => {
        fetchedUsers = documents
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

// exports.getUsersByOrgId = async (req, res, next) => {
//   try {
//     await UserModel.find({organization: req.params.id})
//       .then(users => {
//         return res.status(200).json(users);
//       });
//   } catch (error) {
//     console.log(`getUserByOrgId: ${req.params.id}: ${error.message}`);
//     return res.status(404).json({
//       message: "Couldn't find users"
//     });
//   }
// }

// exports.deleteUser = async (req, res, next) => {
//   try {
//     await UserModel.findByIdAndDelete(req.params.id);
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


getUserByIdHelper = async (uid, userId, orgId) => {  // Can't enfore orgId here since user is enquired at authentication
  let query = uid != userId ? UserModel.findOne({_id: userId, organization: orgId}).populate("organization") : UserModel.findById(userId).populate("organization");
  return await query.then(foundUser => {
    return foundUser;
  });
}

exports.getUserByIdHelper = getUserByIdHelper;

getUserByUserCodeHelper = async (userCode, orgId) => {  // Can't enfore orgId here since user is enquired at authentication
let query =  UserModel.findOne({userCode: userCode, organization: orgId}).populate("organization");
  return await query.then(foundUser => {
    return foundUser;
  });
}

exports.getUserByUserCodeHelper = getUserByUserCodeHelper;

exports.updateUserRole = async (req, res, next) => {
  return await UserModel.findByIdAndUpdate(req.params.id, {$set: {'role': req.body.role}}).then(foundUser => {
    return foundUser;
  });
}

exports.updateUserCurrentOrg = async (req, res, next) => {
  try {
    await UserModel.findById(req.params.id).then(async foundUser => {
      assert(foundUser.organizations.map(o => o.organization).includes(req.body.orgId), "You're not onboarded to this org");
      let foundOrg = foundUser.organizations.filter(o => o.organization == req.body.orgId)[0];
      let org = await OrganizationController.getOrganizationByIdHelper(req.body.orgId);
      assert(org != null, "updateUserCurrentOrg: Org is null");
      foundUser.organization = org._id
      foundUser.pricings = org.pricings;
      foundUser.role = foundOrg.role;
      foundUser.creatorId = foundOrg.creatorId;
      foundUser.active = foundOrg.active;
      await foundUser.save();
      return res.status(200).json(org)
    })
  } catch (error) {
    console.log(`updateUserCurrentOrg: ${error.message} for code ${req.body.code} and user id ${req.params.id}`)
    return res.status(500).json({
      message: "Logged in to org failed"
    })
  }
}

exports.updateUserCredit = async (req, res, next) => {
  return await UserModel.findByIdAndUpdate(req.params.id, {$set: {'credit': req.body.credit}}).then(foundUser => {
    return foundUser;
  });
}

exports.onBoardUserToOrg = async (req, res, next) => {
  let errorMessage = "Onboard user to new org failed, check your secret code";
  try {
    await UserModel.findById(req.params.id).then(async foundUser => {
      let org = await OrganizationController.getOrganizationByRegisterCodeHelper(req.body.code);
      let user = await getUserByUserCodeHelper(req.body.referral);
      assert(org != null, "onBoardUserToOrg: Org is null");
      foundUser.organization = org._id;
      if (foundUser.organizations.map(o => o.organization).includes(org._id)) {
        errorMessage = "Already onboarded to this org";
        throw new Error(errorMessage);
      }
      foundUser.organizations.push({organization: org._id, role: "Customer", credit: 0, creatorId: user? user._id : null});
      foundUser.organization = org._id
      foundUser.pricings = org.pricings;
      foundUser.role = "Customer"
      foundUser.creatorId = user? user._id : null;
      foundUser.active = true;
      await foundUser.save();
      return res.status(200).json(org)
    });
  } catch (error) {
    console.log(`onBoardUserToOrg: ${error.message} for code ${req.body.code} and user id ${req.params.id}`)
    return res.status(500).json({
      message: errorMessage
    })
  };
}

randomString = (length) => {
  let chars = '0123456789'
  let result = '';
  for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
  return result.trim();
}
