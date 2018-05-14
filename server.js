/*jshint esversion: 6 */
//Sets the environment variable as early as possible
require('dotenv').config();

var express = require('express');
var app = express();
var fs = require("fs");
var mongoose = require("mongoose");
var bodyParser = require('body-parser');
var morgan = require('morgan');
var passport = require('passport');
var config = require('./config/main');
var jwt = require('jsonwebtoken');
var User   = require('./models/user');

//Body parser
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//Logging
app.use(morgan('dev'));


app.use("/", require("./routes/api.js"));

//Schemas
var catchSchema = require('./models/catchSchema.js');

//Config
//app.set('superSecret', config.secret);

//Checking if database connection works
mongoose.connect(process.env.DATABASE);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected to database");
});

app.set('connection', db);

var https = require("https");
var port = process.env.PORT || 8081;

// Start the server
var server = https.createServer({
  key: fs.readFileSync("./config/sslcerts/key.pem"),
  cert: fs.readFileSync("./config/sslcerts/cert.pem")
}, app).listen(port, function() {
    console.log("Express started on https://localhost:" + port);
    console.log("Press Ctrl-C to terminate...");
});



/*var server = app.listen(8081, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log("App is listening at localhost", host, port);

});*/
