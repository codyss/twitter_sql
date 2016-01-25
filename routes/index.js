'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');
var tweetModels = require('../models/');

module.exports = function makeRouterWithSockets (io) {

  // a reusable function
  function respondWithAllTweets (req, res, next){
    var allTheTweets = tweetBank.list();
    res.render('index', {
      title: 'Twitter.js',
      tweets: allTheTweets,
      showForm: true
    });
  }


  function respondWithAllTweetsModels (req, res, next){
    var allTheTweets = tweetModels.User.findAll({
      include: [
      {model: tweetModels.Tweet, required: true}
      ]
    }).then(function(data) {
      var cleanTweets = data.map(function(each) {
        return {name: each.dataValues.name, text: each.dataValues["Tweets"][0].dataValues.tweet, id: each.dataValues.id};
        //{ name: name, text: text, id: data.length }
      })
      return cleanTweets;
    }).then(function(data) {
      console.log(data);
      res.render('index', {
      title: 'Twitter.js',
      tweets: data,
      showForm: true
    });
  })};

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweetsModels);
  router.get('/tweets', respondWithAllTweetsModels);

  // single-user page
  router.get('/users/:username', function(req, res, next) {
    var userName = req.params.username;
    var tweetsForName = tweetModels.User.findAll({
      include: [
      {model: tweetModels.Tweet, required: true}
      ]
    }).then(function(data) {
        var tweetsWanted = data.map(function(each) {
          return {name: each.dataValues.name, text: each.dataValues["Tweets"][0].dataValues.tweet, id: each.dataValues.id};
        })
        return tweetsWanted.filter(function(each) {
          return each.name === userName;
        })
      }).then(function(data) {
        res.render('index', {
          title: 'Twitter.js',
          tweets: data,
          showForm: true,
          username: userName
        });
      });
    //   })
    // res.render('index', {
    //   title: 'Twitter.js',
    //   tweets: tweetsForName,
    //   showForm: true,
    //   username: userName
    // });
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    var tweetId = req.params.id;
    var tweetsWithThatId = tweetModels.User.findAll({
      include: [
      {model: tweetModels.Tweet, required: true}
      ]
    }).then(function(data) {
      var tweetsWanted = data.map(function(each) {
        return {name: each.dataValues.name, text: each.dataValues["Tweets"][0].dataValues.tweet, id: each.dataValues.id};
      })
      return tweetsWanted.filter(function(each) {
        return each.id === +tweetId;
      })
    }).then(function(data) {
      res.render('index', {
        title: 'Twitter.js',
        tweets: data // an array of only one element ;-)
      });
    });
  });



  // create a new tweet
  router.post('/tweets', function(req, res, next){
    var newTweet = tweetBank.add(req.body.name, req.body.text);
    io.sockets.emit('new_tweet', newTweet);
    res.redirect('/');
  });

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
