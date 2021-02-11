const UserModel = require('../models/user');
const OrganizationController = require('./organizations');
const db = require('mongoose');
const admin = require('firebase-admin');


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
    user.role = req.body.role;
    user.addresses = addressesSetupHelper(req.body.addresses);
    user.companyCode = req.body.companyCode;
    user.organization = req.body.organization;
    user.userCode = req.body.userCode;
    user.recipients = recipientsSetupHelper(req.body.recipients);
    user.defaultLocation = req.body.defaultLocation;
    user.creatorId = req.userData.uid
    let org = await OrganizationController.getOrganizationByIdHelper(req.body.organization);
    user.pricings = org.pricings;
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
        user._id = req.body._id
        await UserModel.findByIdAndUpdate(req.body._id, user, {new: true}).session(session).then(user => {
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
    foundUser = await this.getUserByIdHelper(req.params.id);
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
    const userQuery = UserModel.find({organization: req.userData.orgId});
    const pageSize = req.query.pageSize? +req.query.pageSize : 5; // Convert to int
    const currentPage = req.query.currentPage? +req.query.currentPage : 0;

    if (pageSize && currentPage) {
      userQuery
        .skip(pageSize * (currentPage))
        .limit(pageSize);
    }
    userQuery.sort({createdAt: -1});

    return await userQuery
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


exports.getUserByIdHelper = async (userId) => {  // Can't enfore orgId here since user is enquired at authentication
  return await UserModel.findById(userId).then(foundUser => {
    return foundUser;
  });
}
