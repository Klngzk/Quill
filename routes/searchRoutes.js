const express   = require('express');
const app       = express();
const router    = express.Router();
const User      =require("../schemas/UserSchema")
const middleware= require('../middleware');
const Post = require('../schemas/PostSchema');








router.get("/", (req, res, next) =>{
    var payload= createPayload(req.session.user)
    res.status(200).render("searchPage",payload);
})

router.get("/:selectedTab", async (req, res, next) =>{
    var payload= createPayload(req.session.user);
    payload.selectedTab = req.params.selectedTab
    res.status(200).render("searchPage",payload);
})

function createPayload(userLoggedIn){
    return {
        
        pageTitle: "Search",
        userLoggedIn: userLoggedIn,
        userLoggedInJS: JSON.stringify(userLoggedIn),
        
    }
}

module.exports = router;