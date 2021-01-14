const UserModel = require('../models/user');
const OrganizationController = require('./organizations');
const db = require('mongoose');

exports.createUpdateUser = async (req, res, next) => {
  try {
    const session = await db.startSession();
    await session.withTransaction(async () => {
      const user = new UserModel();;

      user.name = req.body.name;
      user.email = req.body.email;
      user.phoneNumber = req.body.phoneNumber;
      user.role = req.body.role;
      user.addresses = addressesSetupHelper(req.body.addresses);
      user.companyCode = req.body.companyCode;
      user.organization = req.body.organization;
      user.customerCode = req.body.customerCode;
      user.recipients = recipientsSetupHelper(req.body.recipients);
      user.defaultLocation = req.body.defaultLocation;
      user._id = req.body._id;
      let updatedUser = null;

      let org = await OrganizationController.getOrganizationByIdHelper(req.body.organization);

      user.pricings = org.pricings;

      if (!req.body.newUser) { // edit
        await UserModel.findByIdAndUpdate(req.body._id, user, {new: true}).session(session).then(user => {
          updatedUser = user;
        });
      } else { // create
        await UserModel.create([user], {session: session}).then(user => {
          updatedUser = user[0];
        })
      }

      return res.status(201).json({
        message: "User created/updated successfully",
        user: updatedUser
      });
    });
  } catch(error) {
    console.log(`createUpdateUser: ${req.body.email}: ${error.message}`);
    return res.status(500).json({
      message: "User creation/update failed"
    });
  };
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
    const userQuery = UserModel.find();
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

exports.getUsersByOrgId = async (req, res, next) => {
  try {
    await UserModel.find({organization: req.params.id})
      .then(users => {
        return res.status(200).json(users);
      });
  } catch (error) {
    console.log(`getUserByOrgId: ${req.params.id}: ${error.message}`);
    return res.status(404).json({
      message: "Couldn't find users"
    });
  }
}

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


exports.getUserByIdHelper = async (userId) => {
  return await UserModel.findById(userId).then(foundUser => {
    return foundUser;
  });
}
