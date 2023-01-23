const { static } = require('express');
require('dotenv').config();
const express   = require('express');
const app       = express();
const port      = process.env.PORT || "3003"
const middleware= require('./middleware');
const path      = require('path');
const bodyParser= require("body-parser");
const session       =require('express-session')
const mongoose     = require("./database")
const server    = app.listen(port , () => console.log("Server up at " + port));
const io = require("socket.io")(server, { allowEIO3: true ,pingTimeout: 60000 });
const MongoStore         = require("connect-mongo");
const User      =require("./schemas/UserSchema")



// mongoose.set('useNewUrlParser',true);
// mongoose.set('useUnifiedTopology',true);
// mongoose.set('useFindAndModify',false);

// mongoose.connect("mongodb+srv://admin:M4sIdMxUJVdMnfKu@prjsm.rdgxe.mongodb.net/myFirstDatabase?retryWrites=true&w=majority")
// .then(() =>{
//     console.log("connect")
// })
// .catch((err) =>{
//     console.log(err)
// })

const secret = process.env.SECRET || 'zikoago'

const store = MongoStore.create({
    mongoUrl:"mongodb+srv://admin:M4sIdMxUJVdMnfKu@prjsm.rdgxe.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
    secret,
    touchAfter: 24 * 60 * 60

})
store.on('error' ,function(e){
    console.log('session store error', e)
})

app.set("view engine", "pug");
app.set("views" , "views");
app.use(express.static(path.join(__dirname,"public")));
app.use(bodyParser.urlencoded({extended :false}));
app.use(session({
    store: store,
    secret: secret,
    resave: true,
    saveUninitialized: false
}))

//Routes
// const loginRoute = require('./routes/loginRoutes')
// const registerRoute = require('./routes/registerRoutes')
const startRoute = require('./routes/startRoutes')
const logoutRoute = require('./routes/logout')
const postRoute = require('./routes/postRoutes')
const profileRoute = require('./routes/profileRoutes')
const uploadRoute = require('./routes/uploadRoutes')
const searchRoute = require('./routes/searchRoutes')
const messsagesRoute = require('./routes/messagesRoutes')
const notificationRoute = require('./routes/notificationRoutes')





//Api
const postApiRoute = require('./routes/api/posts')
const userApiRoute = require('./routes/api/users')
const chatApiRoute = require('./routes/api/chats')
const messageApiRoute = require('./routes/api/messages')
const notificationApiRoute = require('./routes/api/notifications')





// app.use("/login", loginRoute);
app.use("/", startRoute);
app.use("/logout", logoutRoute);

app.use("/posts",middleware.requireLogin,postRoute);
app.use("/profile",middleware.requireLogin,profileRoute);
app.use("/uploads",uploadRoute);

app.use("/search",middleware.requireLogin,searchRoute);
app.use("/messages",middleware.requireLogin,messsagesRoute);
app.use("/notifications",middleware.requireLogin,notificationRoute);




app.use("/api/posts", postApiRoute);
app.use("/api/users", userApiRoute);
app.use("/api/chats", chatApiRoute);
app.use("/api/messages", messageApiRoute);
app.use("/api/notifications", notificationApiRoute);












app.get("/",middleware.requireLogin, async (req, res, next) =>{
    var payload={
        pageTitle: "Home",
        userLoggedIn: req.session.user,
        userLoggedInJS: JSON.stringify(req.session.user)

        
    }
    if(payload.userLoggedIn.following[0] == "6119dc0aac1e984d48a80d26" || payload.userLoggedIn._id == "6119dc0aac1e984d48a80d26"){
    res.status(200).render("home",payload);
    }
    else{
        req.session.user = await User.findByIdAndUpdate(req.session.user._id, { $addToSet : {following: "6119dc0aac1e984d48a80d26"} }, {new : true})
        .catch(err => {
            console.log(err);
            res.sendStatus(400);
        })
    
        User.findByIdAndUpdate("6119dc0aac1e984d48a80d26", { $addToSet:{followers : req.session.user._id} })
        .catch(err => {
            console.log(err);
            res.sendStatus(400);
        })

        res.status(200).render("home",payload);
    }
    // res.status(200).render("home",payload);
})

io.on("connection", (socket) => {
    socket.on("setup", userData => {
        socket.join(userData._id);
        socket.emit("connected")
    })
    socket.on("join room", room => socket.join(room))
    socket.on("typing", room => socket.in(room).emit("typing"))
    socket.on("stop typing", room => socket.in(room).emit("stop typing"))
    socket.on("notification received", room => socket.in(room).emit("notification received"))

    socket.on("new mess", newMessage => {
        var chat = newMessage.chat
        if(!chat.users)return console.log("chat.user not defined")

        chat.users.forEach(user => {
            if(user._id == newMessage.sender._id) return
            socket.in(user._id).emit("mess received",newMessage)
        })
    })


})