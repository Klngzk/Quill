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
        pageTitle: "Inbox",
        userLoggedIn: req.session.user,
        userLoggedInJS: JSON.stringify(req.session.user)
    };
    
    res.status(200).render("inboxPage",payload);
})

router.get("/new", async (req, res, next) =>{
    var payload= {
        pageTitle: "New Message",
        userLoggedIn: req.session.user,
        userLoggedInJS: JSON.stringify(req.session.user)
    };
    
    res.status(200).render("newMessagePage",payload);
})
router.get("/:chatId", async (req, res, next) =>{
    var userId = req.session.user._id
    var chatId = req.params.chatId
    var isValidId = mongoose.isValidObjectId(chatId);

    var payload= {
        pageTitle: "Chat",
        userLoggedIn: req.session.user,
        userLoggedInJS: JSON.stringify(req.session.user),
    };

    if(!isValidId){
        payload.errorMessage = "Chat does not exist or you do not have permission to view it2"
        return res.status(200).render("chatPage",payload);
    }

    var chat = await Chat.findOne({_id:chatId,users:{$elemMatch:{$eq:userId}}})
    .populate("users");

    if(chat == null){
        var userFound = await User.findById(chatId);

        if(userFound != null){
            chat = await getChatByUserId(userFound._id,userId)
        }
    }

    if( chat == null){
        payload.errorMessage = "Chat does not exist or you do not have permission to view it"
    }
    else{
        payload.chat = chat;
    }
    
   
    
    res.status(200).render("chatPage",payload);
})

function getChatByUserId(userLoggedIn,otherUserId){
    return Chat.findOneAndUpdate({
        isGroupChat:false,
        users:{
            $size:2,
            $all:[
                { $elemMatch:{$eq:mongoose.Types.ObjectId(userLoggedIn)}},
                { $elemMatch:{$eq:mongoose.Types.ObjectId(otherUserId)}},
            ]
        }
    },
    {
        $setOnInsert:{
            users:[userLoggedIn,otherUserId]
        }
    },
    {
        new:true,
        upsert:true
    })
    .populate("users")
}


module.exports = router;