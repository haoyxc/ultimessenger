var express = require('express');
var router = express.Router();
var moment = require('moment');

var accountSid = process.env.ACCOUNT_SID;
var authToken = process.env.AUTH_TOKEN;
var fromPhone = process.env.FROM_PHONE;
var twilio = require('twilio')(accountSid, authToken);

var models = require('../models/models');

var Contact = models.Contact;
var Message = models.Message;
var User = models.User;

router.post('/messages/receive', function(req, res, next) {
  User.findOne({phone: req.body.To.substring(2)}, function(err, user) {
    Contact.findOne({phone: req.body.From.substring(2)}, function(err, contact) {
      if(err) return next(err);
      var message = new Message({
        created: new Date(),
        content: req.body.Body,
        user: user.id,
        contact: contact.id,
        from: req.body.From,
        status: 'Received',
        channel: 'SMS'
      });
      message.save(function(err) {
        if(err) return next(err);
        res.send("Thanks Twilio <3");
      });
    })
  });
});

router.use(function(req, res, next){
  if (!req.user) {
    res.redirect('/login');
  } else {
    return next();
  }
});

router.get('/', function(req, res, next) {
  res.redirect('/contacts');
});

router.get('/contacts', function(req, res, next) {
  // Load all contacts (that this user has permission to view).
  User.findById(req.user, function(err, user) {
    Contact.find({owner: req.user.id}, function(err, contacts) {
      if (err) return next(err);
      res.render('contacts', {
        contacts: contacts,
        user: user
      });
    });
  })
});

router.get('/contacts/new', function(req, res, next) {
  res.render('editContact');
});

router.post('/contacts/new', function(req, res, next) {
  var contact = new Contact({
    name: req.body.name,
    phone: req.body.phone,
    owner: req.user.id
  });
  contact.save(function(err) {
    if (err) return next(err);
    res.redirect('/contacts');
  })
});

router.get('/contacts/:id', function(req, res, next) {
  Contact.findById(req.params.id, function(err, contact) {
    if (err) return next(err);
    res.render('editContact', {
      contact: contact
    });
  });
});

router.post('/contacts/:id', function(req, res, next) {
  Contact.findById(req.params.id, function(err, contact) {
    if (err) return next(err);
    contact.name = req.body.name;
    contact.phone = req.body.phone;
    contact.owner = req.user.id;
    contact.save(function(err) {
      if (err) return next(err);
      res.redirect('/contacts');
    });
  });
});

router.get('/messages', function(req, res, next) {
  Message
  .find({user: req.user.id})
  .populate({
    path: 'contact',
    model: 'Contact'
  })
  .exec((err, messages) => {
    if (err) return next(err);
    messages.map((msg => (msg.formattedDate = moment(msg.created).format("dddd, MMMM Do YYYY, h:mm:ss a"))));
    res.render('messages', {
      messages: messages
    });
  })
});

router.get('/messages/:id', function(req, res, next) {
  Contact.findById(req.params.id, function(err, contact) {
    if (err) return next(err);
    Message
    .find({user: req.user.id, contact: req.params.id})
    .populate({
      path: 'contact',
      model: 'Contact'
    })
    .exec((err, messages) => {
      if (err) return next(err);
      messages.map((msg => (msg.formattedDate = moment(msg.created).format("dddd, MMMM Do YYYY, h:mm:ss a"))));
      res.render('messages', {
        messages: messages,
        contact: contact
      });
    });
  });
});

router.get('/messages/send/:id', function(req, res, next) {
  Contact.findById(req.params.id, function(err, contact) {
    res.render('newMessage', {
      contact: contact
    });
  });
});

router.post('/messages/send/:id', function(req, res, next) {
  Contact.findById(req.params.id, function(err, contact) {
    if (err) return next(err);

    var message = new Message({
      created: new Date(),
      content: req.body.message,
      user: req.user._id,
      contact: contact._id,
      channel: 'SMS',
      status: 'Sent',
      from: ''
    });

    twilio.messages.create({
      to: "+1" + contact.phone,
      from: fromPhone,
      body: req.body.message
    }, function(err, msg) {
      if (err) return next(err);
      message.save(function(err) {
        if(err) return next(err);
        res.redirect('/messages/' + req.params.id)
      });
      })
  });
});

module.exports = router;
