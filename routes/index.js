var express = require("express");
var router = express.Router();
var models = require("../models/models");
var Contact = models.Contact;

/* GET home page. */
router.get("/", function(req, res, next) {
  // Your code here.
});

router.get("/contacts", (req, res) => {
  console.log("in get contacts");
  req.user.getContacts((err, contacts) => {
    if (err) {
      res.render("/login", {
        loggedIn: false,
        error: "Something went wrong, please try again"
      });
    }
    console.log("contacts", contacts, "IN CONTAACTS");
    res.render("contacts", { contacts: contacts });
  });
});
router.get("/contacts/new", (req, res) => {
  res.render("editContact", { loggedIn: true });
});
router.post("/contacts/new", (req, res) => {
  let name = req.body.name;
  let phone = req.body.phone;
  let contact = new Contact({
    name: name,
    phone: phone,
    owner: req.user._id
  });
  contact.save((err, cont) => {
    if (err) {
      return res.redirect("/contacts/new");
    }
    return res.redirect("/contacts");
  });
});

router.get("/contacts/edit/:id", (req, res) => {
  Contact.findById(req.params.id)
    .then(contact => {
      console.log("contact", contact);
      res.render("editContact", {
        loggedIn: true,
        contact: contact,
        edit: true
      });
    })
    .catch(error => {});
});

// router.post("/contacts/edit/:id", (req,res) => {
//   Contact.findOneAndUpdate(
//     {id: req.params.id}, {$set: {name: req.body.name},
//     $set: {phone: req.body.phone}}
//     )
//     .then(contact => {
//       res.redirect("/contacts")
//     })
//     .catch(() => {
//       res.redirect("/contacts/"+req.params.id)
//     })
//   })
router.post("/contacts/edit/:id", (req, res) => {
  Contact.findOne({ _id: req.params.id })
  .then(c => {
    c.name = req.body.name; 
    c.phone = req.body.phone; 
    res.redirect("/contacts", {});
    console.log(c.name, req.body.name)
  })
  .catch(e=>{
    res.redirect("/contacts/" + req.params.id); 
  })
  // try {
  //   Contact.findOneAndUpdate(
  //     { _id: req.params.id },
  //     { $set: { name: req.body.name, phone: req.body.phone } }
  //   );
  //   res.redirect("/contacts");
  // } catch (e) {
  //   res.redirect("/contacts/" + req.params.id);
  // }
});

module.exports = router;
