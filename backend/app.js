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

// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
const firebase = require('firebase/app');
const admin = require('firebase-admin');

// Connected to dev config in nodemon but prod config in Elastic Beanstalk
const firebaseConfig = {
  apiKey: process.env.fireBaseApiKey,
  authDomain: process.env.authDomain,
  databaseURL: process.env.databaseURL,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appId,
  measurementId: process.env.measurementId
}

firebase.initializeApp(firebaseConfig);
admin.initializeApp(firebaseConfig);

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
};

mongoose.connect("mongodb+srv://supermasil:" + process.env.MONGO_ATLAS_PW + "@cluster0-8khn5.mongodb.net/node-angular?retryWrites=true&w=majority", options)
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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use('/tmp', express.static(path.join(__dirname, "tmp"))); // Allow access to images folder
app.use('/', express.static(path.join(__dirname, "angular"))); // Allow access to angular folder (integrated approach)

app.use('/api/users', usersRoutes); // this route is reserved for backend
// app.use('/api/subscriptions', subscriptionsRoutes); // this route is reserved for backend
app.use('/api/trackings', trackingsRoutes); // this route is reserved for backend
app.use('/api/comments', commentsRoutes); // this route is reserved for backend
app.use('/api/easypost', easyPostRoutes); // this route is reserved for backend
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
