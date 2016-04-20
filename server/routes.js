var path = require('path');
var qs = require('querystring');
var express = require('express');
var jwt = require('jwt-simple');
var moment = require('moment');
var mongoose = require('mongoose');
var request = require('request');
var config = require('../config');
var User = mongoose.model('User');
var Match = require('./models/match');

module.exports = function(app){

  app.get('/api/me', ensureAuthenticated, function(req, res) {
    User.findById(req.user, function(err, user){
      res.send(user);
    })
  });

  app.put('/api/me', ensureAuthenticated, function(req, res){
    console.log('yoyo');
    console.log(req.user);
    User.findById(req.user, function(err, user){
      if(!user){
        return res.status(400).send({ message: 'User not found' });
      }
      user.displayName = req.body.displayName || user.displayName;
      user.email = req.body.email || user.email;
      user.save(function(err){
        res.status(200).end();
      });
    });
  });

  ////////////////////////////////////////////////////////////////////////////////
  // Log in with Email ///////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////

  app.post('/auth/login', function(req, res) {
    // middle parameter..
    User.findOne({ email: req.body.email }, '+password', function(err, user){
      if (!user) {
        return res.status(401).send({ message: 'Wrong email and/or password' });
      }

      user.comparePassword(req.body.password, function(err, isMatch){
        if (!isMatch) {
          return res.status(401).send({ message: 'Wrong email and/or password' });
        }
        res.send({ token: createToken(req, user) });
      });
    });
  });

  ////////////////////////////////////////////////////////////////////////////////
  // Create Email and Password Account ///////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////

  app.post('/auth/signup', function(req, res){
    var user = new User();
    user.fullName = req.body.fullName;
    user.email = req.body.email;
    user.password = req.body.password;

    user.save(function(err) {
      res.send({ token: createToken(req, user) })
    });
  });

  ////////////////////////////////////////////////////////////////////////////////
  // Add Match ///////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////

  app.post('/match/add', function(req, res){
    // create a sample user
    var match = new Match({
      venue: req.body.venue,
      date: req.body.date,
      firstTeam: req.body.firstTeam,
      secondTeam: req.body.secondTeam,
    });
    match.save(function(err) {
      if (err) throw err;

      console.log('Match saved successfully');
      res.json(match);
    });
  });

  app.get('/match/list', function(req, res){
    var d = new Date();

    var n = d.getDate();
    console.log(d);
    Match.find({
      date: {"$gte": d}
    }, function(err, matches){
      console.log(matches);
      res.send(matches);
    });
  });

};

////////////////////////////////////////////////////////////////////////////////
// Login Required Middleware ///////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function ensureAuthenticated(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: 'Please make sure your request has an Authorization header' });
  }
  var token = req.headers.authorization.split(' ')[1];
  var payload = jwt.decode(token, config.TOKEN_SECRET);

  if (payload.exp <= moment().unix()) {
    return res.status(401).send({ message: 'Token has expired' });
  }
  console.log(payload);
  req.user = payload.sub;
  next();
}

////////////////////////////////////////////////////////////////////////////////
// Generate JSON Web Token /////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function createToken(req, user) {
  var payload = {
    iss: req.hostname,
    sub: user._id,
    iat: moment().unix(),
    exp: moment().add(14, 'days').unix()
  };
  return jwt.encode(payload, config.TOKEN_SECRET);
}