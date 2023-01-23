const mongoose     = require("mongoose")

mongoose.set('useNewUrlParser',true);
mongoose.set('useUnifiedTopology',true);
mongoose.set('useFindAndModify',false);
mongoose.set('useCreateIndex',true);



class Database{
    constructor(){
        this.connect()
    }

    connect() {
        mongoose.connect("mongodb+srv://admin:M4sIdMxUJVdMnfKu@prjsm.rdgxe.mongodb.net/myFirstDatabase?retryWrites=true&w=majority")
        .then(() => {
            console.log("db connected")
        })
        .catch((err) =>{
            console.log("db error" + err)
        })
    }
}

module.exports = new Database();