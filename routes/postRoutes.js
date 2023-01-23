const express   = require('express');
const app       = express();
const router    = express.Router();
const User      =require("../schemas/UserSchema")
const middleware= require('../middleware');








router.get("/:id",middleware.requireLogin, (req, res, next) =>{
    var payload={
        pageTitle: "View post",
        userLoggedIn: req.session.user,
        userLoggedInJS: JSON.stringify(req.session.user),
        postId : req.params.id 
    }
    res.status(200).render("postPage",payload);
})


module.exports = router;