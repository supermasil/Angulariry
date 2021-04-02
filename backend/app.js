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
const organizationsRoutes = require('./routes/organizations');
const pricingsRoutes = require('./routes/pricings');
const historiesRoutes = require('./routes/histories');
const mung = require('express-mung');
const rTracer = require('cls-rtracer');
const { createLogger, format, transports } = require('winston')
const { combine, timestamp, printf } = format

// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
const admin = require('firebase-admin');

// a custom format that outputs request id
const rTracerFormat = printf((info) => {
  const rid = rTracer.id();
  return rid
    ? `${info.timestamp} ${rid}: ${info.message}`
    : `${info.timestamp}: ${info.message}`
});

// https://itnext.io/request-id-tracing-in-node-js-applications-c517c7dab62d
const logger = createLogger({
  format: combine(
    timestamp(),
    rTracerFormat
  ),
  transports: [new transports.Console()]
});

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
app.use(rTracer.expressMiddleware()); // Has to be before all the routes
app.use(mung.json((body, req, res) => {
  body.requestId = rTracer.id();
  res.requestId = rTracer.id();
  return body;
}));

const beforeHandler = (req, res, next) => {
  logger.info(req.method + " " + req.originalUrl);
  next();
}

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use('/tmp', express.static(path.join(__dirname, "tmp"))); // Allow access to images folder
app.use('/', express.static(path.join(__dirname, "angular"))); // Allow access to angular folder (integrated approach)

app.use('/api/users', beforeHandler, usersRoutes); // this route is reserved for backend
// app.use('/api/subscriptions', subscriptionsRoutes); // this route is reserved for backend
app.use('/api/trackings', beforeHandler, trackingsRoutes); // this route is reserved for backend
app.use('/api/comments', beforeHandler, commentsRoutes); // this route is reserved for backend
app.use('/api/easypost', beforeHandler, easyPostRoutes); // this route is reserved for backend
app.use('/api/organizations', beforeHandler, organizationsRoutes); // this route is reserved for backend
app.use('/api/pricings', beforeHandler, pricingsRoutes); // this route is reserved for backend
app.use('/api/histories', beforeHandler, historiesRoutes); // this route is reserved for backend

// Error handler
// https://stackoverflow.com/questions/13133071/express-next-function-what-is-it-really-for
app.use((resInfo, req, res, next) => { // Handle errors
  if (resInfo.resCode == 200) {
    logger.info("Execution succeeded");
    return res.status(resInfo.resCode).json(resInfo.resBody);
  } else if (resInfo.resCode == 400 || resInfo.resCode == 500) {
    logger.error(resInfo.error.stack);
    resInfo.requestId = rTracer.id();
    return res.status(resInfo.resCode).json(resInfo.resBody);
  } else { // just error itself
    logger.error(resInfo.error.stack);
    return res.status(500).json({message: "something-went-wrong", requestId: rTracer.id()});
  }
});


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


exports.app = app;
exports.logger = logger;

