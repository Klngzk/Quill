const express   = require('express');
const app       = express();
const router    = express.Router();
const bodyParser= require("body-parser");
const multer= require("multer");
const upload= multer({dest:"uploads/"});
const path= require("path");
const fs= require("fs");

const User      =require("../../schemas/UserSchema")
const Notification     =require("../../schemas/NotificationSchema");
const { deleteModel } = require('mongoose');



app.use(bodyParser.urlencoded({extended :false}));

router.get("/",async (req, res, next) =>{
    var searchObj = req.query;

    if(searchObj.search !== undefined){
        searchObj = {
            $or:[
                {firstName : {$regex: searchObj.search, $options: "i"}},
                {lasttName : {$regex: searchObj.search, $options: "i"}},
                {ussername : {$regex: searchObj.search, $options: "i"}},

            ]
        }
    }
    User.find(searchObj)
    .then(results => res.status(200).send(results))
    .catch(err => {
        console.log(err);
        res.sendStatus(400);
    })
});

router.put("/:userId/follow",async (req, res, next) =>{
    
    var userId = req.params.userId;
    var user = await User.findById(userId);

    if (user == null) return console.log("user is null")

    var isFollowing = user.followers && user.followers.includes(req.session.user._id);

    var option = isFollowing ? "$pull" : "$addToSet";

    req.session.user = await User.findByIdAndUpdate(req.session.user._id, { [option] : {following: userId} }, {new : true})
    .catch(err => {
        console.log(err);
        res.sendStatus(400);
    })

    User.findByIdAndUpdate(userId, { [option]:{followers : req.session.user._id} })
    .catch(err => {
        console.log(err);
        res.sendStatus(400);
    })

    if(!isFollowing){
        await Notification.insertNotification(userId,req.session.user._id,"follow", req.session.user._id)
    }

    res.status(200).send(req.session.user)
});

router.get("/:userId/following",async (req, res, next) =>{
    User.findById(req.params.userId)
    .populate("following")
    .then(results => {
        res.status(200).send(results)
    })
    .catch(err => {
        console.log(err);
        res.sendStatus(400);
    })
});

router.get("/:userId/followers",async (req, res, next) =>{
    User.findById(req.params.userId)
    .populate("followers")
    .then(results => {
        res.status(200).send(results)
    })
    .catch(err => {
        console.log(err);
        res.sendStatus(400);
    })
    
  
});

router.post("/profilePicture",upload.single("croppedImage"),async (req, res, next) =>{
    if(!req.file){
        conosle.log("No file")
        return res.sendStatus(400)
    }
    var filePath = `/uploads/images/${req.file.filename}.png`;
    var tempPath = req.file.path;
    var targetPath = path.join(__dirname, `../../${filePath}`);

    fs.rename(tempPath,targetPath, async err =>{
        if(err !=null){
            console.log(err);
            return res.sendStatus(400)
        } 

        req.session.user = await User.findByIdAndUpdate(req.session.user._id,{profilePic: filePath},{new:true})
        res.sendStatus(200)
    })
});

router.post("/coverPicture",upload.single("croppedImage"),async (req, res, next) =>{
    if(!req.file){
        conosle.log("No file")
        return res.sendStatus(400)
    }
    var filePath = `/uploads/images/${req.file.filename}.png`;
    var tempPath = req.file.path;
    var targetPath = path.join(__dirname, `../../${filePath}`);

    fs.rename(tempPath,targetPath, async err =>{
        if(err !=null){
            console.log(err);
            return res.sendStatus(400)
        } 

        req.session.user = await User.findByIdAndUpdate(req.session.user._id,{coverPic: filePath},{new:true})
        res.sendStatus(200)
    })
});

module.exports = router;