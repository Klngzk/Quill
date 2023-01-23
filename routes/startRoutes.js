const express   = require('express');
const app       = express();
const router    = express.Router();
const bodyParser= require("body-parser");
const User      =require("../schemas/UserSchema")
const Post      =require("../schemas/PostSchema")
const Chat      =require("../schemas/ChatSchema")
const Notification      =require("../schemas/NotificationSchema")
const Message      =require("../schemas/MessageSchema")
const bcrypt    = require('bcrypt')



app.set("view engine", "pug");
app.set("views" , "views");
app.use(bodyParser.urlencoded({extended :false}));


router.get("/start", async (req, res, next) =>{
    // await User.deleteMany({});
    // await Post.deleteMany({});
    // await Chat.deleteMany({});
    // await Message.deleteMany({});
    // await Notification.deleteMany({});
    res.status(200).render("start");
})
router.get("/register", async (req, res, next) =>{

    res.status(200).render("start");
})
router.get("/login", async (req, res, next) =>{

    res.status(200).render("start");
})
router.post("/register", async (req, res, next) =>{
    var payload = {};
    var firstName = req.body.firstName.trim();
    var lastName = req.body.lastName.trim();
    var email = req.body.email.trim();
    var username = req.body.username.trim();
    var password = req.body.password;


    if(firstName && lastName && username && email && password){
        var user = await User.findOne({
            $or: [
                { username : username},
                {email: email}
            ]
        })
        .catch((error) => {
            console.log(error)
        });

        if(user == null){
            //No user found
            var data = req.body;
            data.password = await bcrypt.hash(password,10)

            User.create(data)
            .then((user) => {
                req.session.user = user;
                return res.redirect("/")
            
            })
        }
        else{
            //user found
            if (email == user.email){
                payload.errorMessage='Email is alredy in use'
            }
            else{
                payload.errorMessage='Username is alredy in use'
                

            }
            res.status(200).render("start",payload);

        }

    }
    else {
        console.log("sasa")

        res.status(200).render("start");

    }

})

router.post("/login", async(req, res, next) =>{
    var payload = req.body
    if(req.body.logUsername && req.body.logPassword){
        var user = await User.findOne({
            $or: [
                { username : req.body.logUsername},
                {email: req.body.logUsername}
            ]
        })
        .catch((error) => {
            console.log(error);
            payload.errorMessage='Something went wrong'
            res.status(200).render("start",payload);


        });
        if(user != null){
            var result = await bcrypt.compare(req.body.logPassword, user.password);
            if(result === true){
                req.session.user = user;
                return res.redirect("/")
            }
            
        }

        payload.errorMessage='Login credentials incorrect'
 
        return res.status(200).render("start", payload);
        
    
    }
    
    payload.errorMessage='Make sure each field has a valid value.'
    res.status(200).render("start");
    
})


module.exports = router;