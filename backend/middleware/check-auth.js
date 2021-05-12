const admin = require('firebase-admin');
const app = require("../app");

module.exports = {
  isAuthenticated: (req, res, next) => {
    var authorization = req.headers.authorization.split(" ");
    var idToken = authorization[1];
    var orgId = authorization[2] != 'undefined' ? authorization[2] : null;
    var u_id = authorization[3] != 'undefined' ? authorization[3] : null;
    admin.auth().verifyIdToken(idToken)
    .then(function(decodedToken) {
      req.userData = {email: decodedToken.email, uid: decodedToken.uid, orgId: orgId, u_id: u_id};
      app.logger.info(`Request is made by user id ${u_id} for org ${orgId}`)
      next();
    }).catch(function(error) {
      app.logger.warn("Prevented an unauthorized access");
      res.status(401).json({ message: "You are not authorized!"});
    });
  }
}
