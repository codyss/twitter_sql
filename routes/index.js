'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');
var tweetModels = require('../models/');
var sequelize = require('sequelize');

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
      })
    .then(function(data) {
      //Returns the one user we are interested in
        var userArray = data.filter(function(each) {
          return each.dataValues.name === userName;
        });
        var tweetArray = []
        userArray[0].dataValues.Tweets.forEach(function(tweetText) {
          tweetArray.push({name: userArray[0].dataValues.name, text: tweetText.dataValues.tweet, id: userArray[0].dataValues.id});
        });
      return tweetArray;
      }
    )
    .then(function(data) {
        res.render('index', {
          title: 'Twitter.js',
          tweets: data, //array of tweet objects
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
    var user = req.body.name;
    var tweetToPost = req.body.text;
    //SEARCH IF USER EXITS
    tweetModels.User.findAll({where:{'name':user}})
    .then(function (data) {
      if (data.length > 0) {
    //IF USER - POST TWEET AS THAT USER
        var userId = data[0].dataValues.id;
        tweetModels.Tweet.create({tweet: tweetToPost, UserId: userId});

      } else {
    //IF NO USER - CREATE USER AND POST TWEET AS THAT USER
        tweetModels.User.create({name: user, pictureUrl: "http://www.fullstackacademy.com/img/team/zeke_nierenberg@2x_nerd.jpg"})
        .then(function() {
          var newUserId = tweetModels.User.count(); return newUserId})
        .then(function(data) {
          tweetModels.Tweet.create({tweet: tweetToPost, UserId: data});          
        });
        // tweetModels.User.findAll({attributes: sequelize.fn('COUNT', sequelize.col('id')), 'num_users'})
      }
    }).then(
    function(tweet) {
      io.sockets.emit('new_tweet', tweet);
      res.redirect('/');
    });
  });


// Tweet.create({ title: 'foo', description: 'bar', deadline: new Date() }).then(function(task) {
//   // you can now access the newly created task via the variable task
// })

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
