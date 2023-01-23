const express   = require('express');
const mongoose   = require('mongoose');

const app       = express();
const router    = express.Router();
const User      =require("../schemas/UserSchema")
const middleware= require('../middleware');
const Post = require('../schemas/PostSchema');
const Chat = require('../schemas/ChatSchema');









router.get("/", async (req, res, next) =>{
    var payload= {
        pageTitle: "Notification",
        userLoggedIn: req.session.user,
        userLoggedInJS: JSON.stringify(req.session.user)
    };
    
    res.status(200).render("notificationPage",payload);
})



module.exports = router;