/*jshint esversion: 6 */
const router = require("express").Router();
const mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var express = require('express');
var app = express();
var validator = require('validator');
var WebHooks = require('node-webhooks');
var xss = require('xss');
var jwt_decode = require('jwt-decode');

//Schemas
var catchSchema = require('../models/catchSchema.js');
var User = require('../models/user.js');

var webHooks = new WebHooks({
    db: './webHooksDB.json', // json file that store webhook URLs
});

// SETUP - This will just be used to create a few users.
/*router.route("/api/setup")
    .get((req, res) => {
        //This is the admin user
        var user1 = new User({
          name: 'Sven-Göran',
          password: 'password',
          isAdmin: true
        });
        var user2 = new User({
          name: 'Klas-Gunnar',
          password: 'password',
          isAdmin: false
        });
        var user3 = new User({
          name: 'Lars-Arne',
          password: 'password',
          isAdmin: false
        });
        user1.save(function(err) {
          if (err) res.status(400).json({success: false, status: 400, message: "Something went wrong!"});
          console.log('User 1 saved successfully');
        });
        user2.save(function(err) {
          if (err) res.status(400).json({success: false, status: 400, message: "Something went wrong!"});
          console.log('User 2 saved successfully');
        });
        user3.save(function(err) {
          if (err) res.status(400).json({success: false, status: 400, message: "Something went wrong!"});
          console.log('User 3 saved successfully');
        });
        res.json({ success: true, message: "Setup complete! Created 3 users."});
    });
*/

        router.route("/api")
            .get((req, res) => {
              res.json({self: "/api/", catch: "/api/catch/", webhook: "/api/webhook/", user: "/api/user/"});
            });

        router.route("/api/catch")
              .get((req, res) => {
                res.json(
                  {
                    self:{href:"/api/catch/", method:"GET", desc:"Get self method to current route", params: "{}", header: "Content-Type: application/x-www-form-urlencoded"},
                    getAll: {href: "/api/catch/all/", method:"GET", desc:"Get all catches", params: "{}", header: "Content-Type: application/x-www-form-urlencoded"},
                    getOne: {href: "/api/catch/one/:catchId", method:"GET", desc:"Get one catch by id", params: "{catchId}", header: "Content-Type: application/x-www-form-urlencoded"},
                    delete:{href:"/api/catch/delete/:catchId", method:"DELETE", desc:"Delete a catch by id", params:"{catchId}", header: "Content-Type: application/x-www-form-urlencoded, x-access-token: {token}" },
                    update: {href: "/api/catch/update/:catchId", method:"PUT", desc:"Update a catch by id", params:"{catchId}{position}{specie}{weight}{length}{imageUrl}{timestamp}{other}{description}", header: "Content-Type: application/x-www-form-urlencoded, x-access-token: {token}"}
                  });
              });
        router.route("/api/user")
            //Get users
            .get((req, res) => {
              res.json(
                {
                  self:{href:"/api/user/", method:"GET", desc:"Get self method to current route", params: "{}"},
                  create: {href: "/api/user/create/", method:"POST", desc:"Create a new user", params: "{name}{password}"},
                  authenticate: {href: "/api/user/auth", method:"POST", desc:"Send username and password to get an access token", params: "{name}{password}"},
                });
            });

        router.route("/api/webhook")
            .get((req, res) => {
              res.json(
                {
                  self: {href:"/api/webhook/", method:"GET", desc:"Get self method to current route", params: "{}", header: "Content-Type: application/x-www-form-urlencoded"},
                  register: {href: "/api/webhook/register/", method:"POST", desc:"Registers a new webhook", params: "{hookName}{payloadURL}", header: "Content-Type: application/x-www-form-urlencoded, x-access-token: {token}"},
                });
            });

        //CREATE USER
        //Will create a user
        //TODO Fixa xxs
        router.route("/api/user/create")
            .post((req, res) => {
              if(validator.isEmpty(req.body.name) || validator.isEmpty(req.body.password)){
                res.status(400).json({success: false, status: 400, message: "No username or password provided."});
              }
              if(!validator.isLength(req.body.name, {min:3, max: 30}) ||
              !validator.isLength(req.body.password, {min:8, max: undefined})){
                res.status(400).json({success: false, status: 400, message: "Username must be 3-30 characters long and password at least 8."});
              }

              //If validation passes, do this
              else{
                var user = new User({
                  name: xss(req.body.name),
                  password: req.body.password
                });
                User.find({ name: req.body.name }, function(err, result) {
                    if(result.length > 0){
                      res.status(400).json({success: false, status: 400, message: "User already exists!"});
                    }
                    else{
                      user.save(function(err) {
                        if (err) res.status(500).json({success: false, status: 500, message: "Something went wrong! "});


                        else {
                          var linkArr = [
                          {rel:"self", href: "/api/catch/create/", method: "POST", desc: "Create a new user", params: "{name}{password}", header: "Content-Type: application/x-www-form-urlencoded"},
                          {rel:"user", href: "/api/user/auth/", method: "POST", desc: "Authenticate a user", params: "{name}{password}", header: "Content-Type: application/x-www-form-urlencoded"},
                          {rel:"catch", href: "/api/catch/add/", method: "POST", desc: "Update a catch by id", params: "{user}{position}{specie}{weight}{length}{imageUrl}{other}{description}", header: "Content-Type: application/x-www-form-urlencoded, x-access-token: {token}"}];

                          res.status(201).json({success: true, status: 201, message: "User created!"});
                        }
                      });
                    }
                });
              }
            });

        //GET CATCH BY ID
        router.route("/api/catch/one/:catchId")
            .get((req, res) => {
              //catchSchema.findById(req.body.id, function(err, result) {
              catchSchema.find({catchId: req.params.catchId}, function(err, result) {
                if (err) res.status(500).json({success: false, status: 500, message: "Something went wrong!"});

                var linkArr = [
                {rel:"self", href: "/api/catch/one/"+req.params.catchId, method: "GET", desc: "Get one catch by id", params: "{}", header: "Content-Type: application/x-www-form-urlencoded"},
                {rel:"delete", href: "/api/catch/delete/"+req.params.catchId, method: "DELETE", desc: "Delete a catch by id", params: "{}", header: "Content-Type: application/x-www-form-urlencoded, x-access-token: {token}"},
                {rel:"update", href: "/api/catch/update/"+req.params.catchId, method: "PUT", desc: "Update a catch by id", params: "{position}{specie}{weight}{length}{imageUrl}{other}{description}", header: "Content-Type: application/x-www-form-urlencoded, x-access-token: {token}"}];

                res.status(200).json({result, links: linkArr});
              });
            });

        //AUTH
        //A token will be given if the user credentials are ok
        router.route("/api/user/auth")
            .post((req, res) => {
              if(validator.isEmpty(req.body.name) || validator.isEmpty(req.body.password)){
                res.status(401).json({success: false, status: 401, message: "No username or password provided."});
              }
              else{
                User.findOne({
                  name: req.body.name
                }, function(err, user) {
                  if (err){
                    res.status(500).json({success: false, status: 500, message: "Something went wrong! "});
                  }
                  if (!user) {
                    res.status(400).json({success: false, status: 400, message: "User not found!"});
                  }
                  else if (user) {
                    user.comparePassword(req.body.password, function(err, isMatch) {
                        if (isMatch === false) {
                          res.status(401).json({success: false, status: 401, message: "Wrong username/password"});
                        }
                        else {
                          var token = jwt.sign(user, process.env.SECRET, {
                            expiresIn: 1440 // expires in 24 hours
                          });
                          res.status(200).json({links: {self: "/api/user/auth/"}, success: true, token: token});
                        }
                    });
                  }
                });
              }
            });

        //GET ALL CATCHES
        router.route("/api/catch/all")
            .get((req, res) => {
              catchSchema.find({}, function(err, result) {
                if (err) res.status(500).json({success: false, status: 500, message: "Something went wrong when trying to get all catches!"});

                var test = [];
                for (i = 0; i < result.length; i++) {
                    var linkArr = [
                    {rel:"catch", href: "/api/catch/one/"+result[i].catchId, method: "GET", desc: "Get one catch by id", params: "{}", header: "Content-Type: application/x-www-form-urlencoded"},
                    {rel:"self", href: "/api/catch/all", method: "GET", desc: "Get all catches", params: "{}", header: "Content-Type: application/x-www-form-urlencoded"}];

                    var tempResult = result[i];
                    test.push({result: tempResult, links: linkArr});
                }
                res.status(200).json(test);
              });
            });

        //MIDDLEWARE
        //********Verifies the token when trying to access all functions below***********
        router.use(function(req, res, next) {
          var token = req.body.token || req.query.token || req.headers['x-access-token'];

          if (token) {
            jwt.verify(token, process.env.SECRET, function(err, decoded) {
              if (err) {
                return res.status(401).json({success: false, status: 401, message: "Failed to authenticate token."});
              } else {
                req.decoded = decoded;
                next();
              }
            });
          } else {
            return res.status(403).json({success: false, status: 403, message: "No token provided!"});
          }
        });

        //REGISTER WEBHOOK
        router.route("/api/webhook/register")
            .post((req, res) => {
              if(validator.isEmpty(req.body.payloadURL)){
                res.status(400).json({success: false, status: 400, message: "No payload url provided."});
              }
                  if(validator.isURL(req.body.payloadURL)){
                    webHooks.add('hook', req.body.payloadURL).then(function(){
                        res.status(201).json({success: true, status: 201, message: "Successfully added a webhook!"});
                      }).catch(function(err){
                          res.status(500).json({success: false, status: 500, message: "Something went wrong!"});
                      });
                  }
                  else{
                    res.status(400).json({success: false, status: 400, message: "Not a valid URL"});
                  }
            });


        //ADD CATCH
        router.route("/api/catch/add")
            .post((req, res) => {
              //Source: http://stackoverflow.com/questions/3518504/regular-expression-for-matching-latitude-longitude-coordinates
              var regexCoordinates = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;

              if(!req.body.position.match(regexCoordinates)){
                res.status(400).json({success: false, status: 400, message: "Coordinates are not valid!"});
              }
              if(validator.isEmpty(req.body.specie)){
                res.status(400).json({success: false, status: 400, message: "Specie is empty or contains unallowed characters!"});
              }
              if(validator.isEmpty(req.body.weight) || !validator.isNumeric(req.body.weight)){
                res.status(400).json({success: false, status: 400, message: "Weigth is empty or not a number!"});
              }
              if(validator.isEmpty(req.body.length) || !validator.isNumeric(req.body.length)){
                res.status(400).json({success: false, status: 400, message: "Length is empty or not a number!"});
              }
              if(validator.isEmpty(req.body.imageUrl) || !validator.isURL(req.body.imageUrl)){
                res.status(400).json({success: false, status: 400, message: "ImageUrl is empty or not valid!"});
              }
              if(validator.isEmpty(req.body.other) || !validator.isLength(req.body.other, {min:1, max: 200})){
                res.status(400).json({success: false, status: 400, message: "Other is empty or more than 200 characters!"});
              }
              if(validator.isEmpty(req.body.description) || !validator.isLength(req.body.description, {min:1, max: 200})){
                res.status(400).json({success: false, status: 400, message: "Description is empty or more than 200 characters!"});
              }

              else{

                var token = req.body.token || req.query.token || req.headers['x-access-token'];

                var decoded = jwt_decode(token);

                let catchData = new catchSchema({
                    user:         decoded._doc.name,
                    position:     xss(req.body.position),
                    specie:       xss(req.body.specie),
                    weight :      xss(req.body.weight),
                    length :      xss(req.body.length),
                    imageUrl :    xss(req.body.imageUrl),
                    timestamp :   Date.now(),
                    other :       xss(req.body.other),
                    description : xss(req.body.description)
                });

              catchData.save(function(err, results){
                if (err) res.status(500).json({success: false, status: 500, message: "Something went wrong!"});

                var linkArr = [
                {rel:"catch", href: "/api/catch/one/"+results.catchId, method: "GET", desc:"Get a catch by id", params: "{}", header: "Content-Type: application/x-www-form-urlencoded"},
                {rel:"self", href: "/api/catch/add/", method: "POST", desc:"Add a new catch", params: "{catchName}{user}{position}{specie}{weight}{length}{imageUrl}{other}{description}", header: "Content-Type: application/x-www-form-urlencoded, x-access-token: {token}"},
                {rel:"catch", href: "/api/catch/delete/"+results.catchId, method: "DELETE", desc:"Delete a catch by id", params:"{}", header: "Content-Type: application/x-www-form-urlencoded, x-access-token: {token}"},
                {rel:"catch", href: "/api/catch/update/"+results.catchId, method: "PUT", desc: "Update a catch by id", params: "{position}{specie}{weight}{length}{imageUrl}{other}{description}", header: "Content-Type: application/x-www-form-urlencoded, x-access-token: {token}"}];

                //Triggers the webhook
                webHooks.trigger('hook', {from: req.body.user ,data: req.body.user + " catched a " + req.body.specie});

                res.status(201).json({success: true, status: 201, message: "Successfully added a catch!", links: linkArr});
              });
              }
            });

        //DELETE CATCH
        router.route("/api/catch/delete/:catchId")
            .delete((req, res) => {
              catchSchema.findOneAndRemove({catchId: req.params.catchId}, function(err){
                if (err) {
                  res.status(500).json({success: false, status: 500, message: "Something went wrong!"});
                }
                else{
                  var linkArr = [
                  {rel:"self", href: "/api/catch/delete/"+req.params.catchId, method: "DELETE", desc:"Delete a catch by id", params:"{}", header: "Content-Type: application/x-www-form-urlencoded, x-access-token: {token}"}];
                  res.status(200).json({success: true, status: 200, message: "Successfully deleted a catch!", links: linkArr});
                }
              });
            });

        //UPDATE CATCH
        router.route("/api/catch/update/:catchId")
            .put((req, res) => {
              if(!isNaN(req.params.catchId)){
              catchSchema.findOneAndUpdate( {catchId: req.params.catchId} , {
                      position:     xss(req.body.position),
                      specie:       xss(req.body.specie),
                      weight :      xss(req.body.weight),
                      length :      xss(req.body.length),
                      imageUrl :    xss(req.body.imageUrl),
                      other :       xss(req.body.other),
                      description : xss(req.body.description) },
                function(err, user) {
                  if (err) res.status(500).json({success: false, status: 500, message: "Something went wrong"});
                    else{
                        var linkArr = [
                        {rel:"catch", href: "/api/catch/one/"+req.params.catchId, method: "GET" , desc:"Get a catch by id", params: "{}", header: "Content-Type: application/x-www-form-urlencoded"},
                        {rel:"catch", href: "/api/catch/delete/"+req.params.catchId, method: "DELETE", desc:"Delete a catch by id", params: "{}", header: "Content-Type: application/x-www-form-urlencoded, x-access-token: {token}"},
                        {rel:"self", href: "/api/catch/update/"+req.params.catchId, method: "PUT", desc:"Update a catch by id", params: "{position}{specie}{weight}{length}{imageUrl}{other}{description}", header: "Content-Type: application/x-www-form-urlencoded, x-access-token: {token}"}];

                        res.status(201).json({success: true, status: 201, message: "Successfully updated a catch!",
                        links: linkArr});
                  }
                });
              }
              else{
                res.status(400).json({success: false, status: 400, message: "catchId is not a valid number!"});
              }
            });
module.exports = router;
