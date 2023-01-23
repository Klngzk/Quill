const express   = require('express');
const app       = express();
const router    = express.Router();
const User      =require("../schemas/UserSchema")
const middleware= require('../middleware');
const path= require('path');









router.get("/images/:path", (req, res, next) =>{
    res.sendFile(path.join(__dirname, "../uploads/images/" + req.params.path))
})


module.exports = router;