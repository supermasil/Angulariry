const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

const usersRoutes = require('./routes/users');
// const subscriptionsRoutes = require('./routes/subscriptions');
const trackingsRoutes = require('./routes/trackings');
const commentsRoutes = require('./routes/comments');
const easyPostRoutes = require('./routes/easypost-webhook');
const organizationstRoutes = require('./routes/organizations');
const pricingstRoutes = require('./routes/pricings');

// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
const admin = require('firebase-admin');

// Connected to dev config in nodemon but prod config in Elastic Beanstalk
var serviceAccount = {
  type: process.env.admin_type,
  project_id: process.env.admin_project_id,
  private_key_id: process.env.admin_private_key_id,
  private_key: process.env.admin_private_key.replace(/\\n/g, '\n'),
  client_email: process.env.admin_client_email,
  client_id: process.env.admin_client_id,
  auth_uri: process.env.admin_auth_uri,
  token_uri: process.env.admin_token_uri,
  auth_provider_x509_cert_url: process.env.admin_auth_provider_x509_cert_url,
  client_x509_cert_url: process.env.admin_client_x509_cert_url
}


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://musicacademy-fac23.firebaseio.com"
});

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
};

console.log(process.env.dbName)

mongoose.connect(`mongodb+srv://supermasil:${process.env.MONGO_ATLAS_PW}@cluster0-8khn5.mongodb.net/${process.env.dbName}?retryWrites=true&w=majority`, options)
  .then(() => {
    console.log('Connected to database');
  })
  .catch((error) => {
    console.log('Connection failed');
    console.log(error);
  });

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers',
  'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTION');
  next();
}); // this is used to allow angular to access backend, it's not needed if using integrated approach

// ORDER MATTERS
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use('/tmp', express.static(path.join(__dirname, "tmp"))); // Allow access to images folder
app.use('/', express.static(path.join(__dirname, "angular"))); // Allow access to angular folder (integrated approach)

app.use('/api/users', usersRoutes); // this route is reserved for backend
// app.use('/api/subscriptions', subscriptionsRoutes); // this route is reserved for backend
app.use('/api/trackings', trackingsRoutes); // this route is reserved for backend
app.use('/api/comments', commentsRoutes); // this route is reserved for backend
app.use('/api/easypost', easyPostRoutes); // this route is reserved for backend
app.use('/api/organizations', organizationstRoutes); // this route is reserved for backend
app.use('/api/pricings', pricingstRoutes); // this route is reserved for backend
app.use((req, res, next) => {
  // if (err.status === 404) {
  //   return res.sendFile(path.join(__dirname, "angular", "index.html"));
  // }
  // console.log("123");

  /** The request usually go throught the backend first before the front end. So by doing this, if this route is not found in the back end,
   * it would be forwarded to the front end through index.html and the router there will take care of this one.
   * For example the case of /edit/:postId
   * We will handle 404 cases in app-routing.module.ts
   */
  res.sendFile(path.join(__dirname, "angular", "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
});

module.exports = app;
