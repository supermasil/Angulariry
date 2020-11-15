const admin = require('firebase-admin');

module.exports = {
  isAuthenticated: (req, res, next) => {
    var authorization = req.headers.authorization.split(" ");
    var idToken = authorization[1]
    admin.auth().verifyIdToken(idToken)
    .then(function(decodedToken) {
      req.userData = {email: decodedToken.email, uid: decodedToken.uid};
      next();
    }).catch(function(error) {
      res.status(401).json({ message: "You are not authorized!"});
    });
  }
}
