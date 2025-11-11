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
	res.render ( "login.ejs",{message:""});	
} );

app.get("/loginx", (req, res) =>
{
    User.findOne({userid:req.query.userid}, '', function (err, data)
    {
        if (err) return handleError(err);
        if (data==null)
        {
            if (err) return handleError(err);
            res.render ( "login",{message:"Invalid Userid"});
        }
        else
        {
                if(req.query.password==data.password)
                {
                    res.render ( "login",{message:"Login Successful"});
                } 
                else
                {
                    res.render( "login",{message:"Invalid Password"});
                }
        }
    });
});

app.listen(3000 , function () {
	console.log ("server is listening!!!");
} );