const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

const postsRoutes = require('./routes/posts');
const usersRoutes = require('./routes/users')

mongoose.connect("mongodb+srv://supermasil:" + process.env.MONGO_ATLAS_PW + "@cluster0-8khn5.mongodb.net/node-angular?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true})
  .then(() => {
    console.log('Connected to database');
  })
  .catch(() => {
    console.log('Connection failed');
  });

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers',
  'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTION');
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use('/images', express.static(path.join(__dirname, "images"))); // Allow access to images folder
app.use('/', express.static(path.join(__dirname, "angular"))); // Allow access to images folder

app.use('/api/posts', postsRoutes); // this route is reserved for backend
app.use('/api/users', usersRoutes); // this route is reserved for backend
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "angular", "index.html"));
}); // Handle routes other than the two routes above. This will help request reach the front end

module.exports = app;
