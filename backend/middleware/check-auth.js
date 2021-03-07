const admin = require('firebase-admin');

module.exports = {
  isAuthenticated: (req, res, next) => {
    var authorization = req.headers.authorization.split(" ");
    var idToken = authorization[1];
    var orgId = authorization[2] != 'undefined' ? authorization[2] : null;
    admin.auth().verifyIdToken(idToken)
    .then(function(decodedToken) {
      req.userData = {email: decodedToken.email, uid: decodedToken.uid, orgId: orgId};
      next();
    }).catch(function(error) {
      console.log("Prevented an unauthorized access");
      res.status(401).json({ message: "You are not authorized!"});
    });
  }
}
