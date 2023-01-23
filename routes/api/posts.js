const express   = require('express');
const app       = express();
const router    = express.Router();
const bodyParser= require("body-parser");
const User      =require("../../schemas/UserSchema")
const Post      =require("../../schemas/PostSchema");
const Notification      =require("../../schemas/NotificationSchema");
const { deleteModel } = require('mongoose');



app.use(bodyParser.urlencoded({extended :false}));



router.get("/",async (req, res, next) =>{
    // Post.find()
    // .populate("postedBy")
    // .populate("shareData")
    // .sort({"createdAt":-1})
    // .then(async results =>{
    //     results = await User.populate(results, {path: "shareData.postedBy"});
    //     res.status(200).send(results)
    // })
    // .catch(err => {
    //     console.log(err);
    //     res.sendStatus(400);
    // })
    var searchObj = req.query;

    if(searchObj.isReply !== undefined){
        var isReply = searchObj.isReply == "true";
        searchObj.replyTo = { $exists: isReply};
        delete searchObj.isReply;
    }

    if(searchObj.search !== undefined){
        searchObj.content = {$regex: searchObj.search, $options: "i"};
        delete searchObj.search;
    }


    if(searchObj.followingOnly != undefined){
        var followingOnly = searchObj.followingOnly == "true";

        if(followingOnly){
            var objectIds = []
        
            if(!req.session.user.following){
                req.session.user.following = []
            }

            req.session.user.following.forEach(user => {
                objectIds.push(user)
            })

            objectIds.push(req.session.user._id)
            searchObj.postedBy = { $in: objectIds};

        }

        delete searchObj.followingOnly;

    }

    var results = await getPosts(searchObj);
    res.status(200).send(results)
   
})

router.get("/:id",async (req, res, next) =>{
    var postId = req.params.id

    var postData = await getPosts({_id: postId});
    postData = postData[0]

    var results = {
        postData: postData
    }

    if(postData.replyTo !== undefined){
        results.replyTo = postData.replyTo;
    }

    results.replies= await getPosts({replyTo: postId});
    res.status(200).send(results)
})

router.post("/", async(req, res, next) =>{

    // if(req.body.replyTo){
    //     console.log(req.body.replyTo)
    //     return res.sendStatus(400)
    // }
    if (!req.body.content){
        console.log("No contenet");
        return res.sendStatus(400);
    }

    var postData = {
        content: req.body.content,
        postedBy: req.session.user
    }

    if(req.body.replyTo) {
        postData.replyTo = req.body.replyTo  ;
    }
    // await Post.deleteMany({});

    Post.create(postData)
    .then(async newPost =>{
        newPost = await User.populate(newPost, {path:"postedBy"})
        newPost = await Post.populate(newPost, {path:"replyTo"})
        if(newPost.replyTo !== undefined){
            await Notification.insertNotification(newPost.replyTo.postedBy,req.session.user._id,"reply", newPost._id)
    
        }

        res.status(201).send(newPost);
    })
    .catch(err =>{
        console.log(err);
        res.status(400);
    })
})

router.put("/:id/like", async(req, res, next) =>{
    var postId = req.params.id;
    var userId = req.session.user._id;

    var isLiked = req.session.user.likes && req.session.user.likes.includes(postId);

    var option = isLiked ? "$pull" : "$addToSet";

    //Insert user like
    req.session.user = await User.findByIdAndUpdate(userId, { [option]:{likes:postId} }, {new : true})
    .catch(err => {
        console.log(err);
        res.sendStatus(400);
    })

    //Insert post like
    var post = await Post.findByIdAndUpdate(postId, { [option]:{likes:userId} }, {new : true})
    .catch(err => {
        console.log(err);
        res.sendStatus(400);
    })

    if(!isLiked){
        await Notification.insertNotification(post.postedBy,userId,"postLike", post._id)

    }

    res.status(200).send(post);

})

router.post("/:id/share", async(req, res, next) =>{
    var postId = req.params.id;
    var userId = req.session.user._id;

    var isLiked = req.session.user.likes && req.session.user.likes.includes(postId);


    //Try and delete sahre
    var deletePost = await Post.findOneAndDelete({postedBy: userId, shareData: postId})
    .catch(err => {
        console.log(err);
        res.sendStatus(400);
    })
    var option = deletePost != null ? "$pull" : "$addToSet";

    var repost = deletePost;

    if(repost == null){
        repost = await Post.create({postedBy: userId, shareData: postId})
        .catch(err => {
            console.log(err);
            res.sendStatus(400);
    })
}

  //Insert user like
  req.session.user = await User.findByIdAndUpdate(userId, { [option]:{shares: repost._id} }, {new : true})
  .catch(err => {
      console.log(err);
      res.sendStatus(400);
  })

    //Insert post like
    var post = await Post.findByIdAndUpdate(postId, { [option]:{shareUsers:userId} }, {new : true})
    .catch(err => {
        console.log(err);
        res.sendStatus(400);
    })

    if(!deletePost){
        await Notification.insertNotification(post.postedBy,userId,"share", post._id)

    }

    res.status(200).send(post);

})
router.put("/:id" ,async (req,res,next) =>{
    if(req.body.pinned !== undefined){
        await Post.updateMany({postedBy:req.session.user},{pinned:false})
        .catch ((err) =>{
            console.log(err)
            res.sendStatus(400)
        })
    }

    Post.findByIdAndUpdate(req.params.id , req.body)
    .then(() => res.sendStatus(202))
    .catch ((err) =>{
        console.log(err)
        res.sendStatus(400)
    })
 
})
router.delete("/:id" ,(req,res,next) =>{
    

    Post.findByIdAndDelete(req.params.id)
    .then(() => res.sendStatus(202))
    .catch ((err) =>{
        console.log(err)
        res.sendStatus(400)
    })
 
})


async function getPosts(filter){
    var results = await Post.find(filter)
    .populate("postedBy")
    .populate("shareData")
    .populate("replyTo")
    .sort({"createdAt":-1})
    .catch(err =>  console.log(err))


    results = await User.populate(results, {path: "replyTo.postedBy"});
    return await User.populate(results, {path: "shareData.postedBy"});
        
   
    
}

module.exports = router;