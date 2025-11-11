const express = require ('express'); 
const app = express(); 
app.set('view engine', 'ejs');
app.use(express.static("public"));
var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/cis485",{useUnifiedTopology: true,useNewUrlParser: true });

var loginSchema = new mongoose.Schema({
    userid: String,
    password: String
});

var User = mongoose.model("login", loginSchema);

app.use((req, res, next) => {
  console.log(`request made to: ${req.url}`);
  next();
});

app.get ("/", function (req,res) 
{
	res.render ( "register.ejs",{message:""});	
} );

app.get("/register", (req, res) =>

{
    User.findOne({userid:req.query.userid}, '', function (err, data)
    {
        if (err) return handleError(err);
        if (data==null)
        {       
                var x = new User(req.query);
                x.save(function (err)
                { 
                    if (err) return handleError(err);
                    res.render ( "register",{message: 'Registration Succelfull'});
                });
        }
        else
        {
            res.render ( "register",{message: 'ERROR: User Already In Database'});
        }
    });
});

app.listen(3000 , function () {
	console.log ("server is listening!!!");
} );