const express   = require('express');
const app       = express();
const router    = express.Router();
const User      =require("../schemas/UserSchema")
const middleware= require('../middleware');
const Post = require('../schemas/PostSchema');








router.get("/", (req, res, next) =>{
    var payload={
        pageTitle: req.session.user.username,
        userLoggedIn: req.session.user,
        userLoggedInJS: JSON.stringify(req.session.user),
        profileUser: req.session.user
    }
    res.status(200).render("profilePage",payload);
})

router.get("/:username", async (req, res, next) =>{
    var payload= await getPayload(req.params.username,req.session.user)
    res.status(200).render("profilePage",payload);
})


router.get("/:username/replies", async (req, res, next) =>{
    var payload= await getPayload(req.params.username,req.session.user)
    payload.selectedTab= "replies";
    res.status(200).render("profilePage",payload);
})

router.get("/:username/following", async (req, res, next) =>{
    var payload= await getPayload(req.params.username,req.session.user)
    payload.selectedTab= "following";
    res.status(200).render("followingAndFollowers",payload);
})

router.get("/:username/followers", async (req, res, next) =>{
    var payload= await getPayload(req.params.username,req.session.user)
    payload.selectedTab= "followers";
    res.status(200).render("followingAndFollowers",payload);
})

async function getPayload(username,userLoggedIn){
    var user = await User.findOne({username:username})

    if(user == null){
        return {
                    pageTitle: "User not found",
                    userLoggedIn: userLoggedIn,
                    userLoggedInJS: JSON.stringify(userLoggedIn)
                }
        
        // user = await User.findById(username);

        // console.log(user)
        // if(user == null){
        //     return {
        //         pageTitle: "User not found",
        //         userLoggedIn: userLoggedIn,
        //         userLoggedInJS: JSON.stringify(userLoggedIn)
        //     }
        // }
    }
    return {
        pageTitle: user.username,
        userLoggedIn: userLoggedIn,
        userLoggedInJS: JSON.stringify(userLoggedIn),
        profileUser: user

    }
}


module.exports = router;