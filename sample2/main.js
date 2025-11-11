const getJSONString = function(obj) { return JSON.stringify(obj, null, 2);}
var express = require ('express'); 
var app = express();
const layouts=require("express-ejs-layouts");
app.use(layouts); 
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`request made to: ${req.url}`);
  next();
});

app.get ("/", function (req,res) 
{
	let input="",output="";
	res.render ( "inc1.ejs");	
} );
	
app.post('/', function(req, res)
{
   let input="",output="";
   let choice=req.body["choice"];
   console.log("body="+getJSONString(req.body));
   console.log("query="+req.query);
   if(choice=="Clear") input=output="";
   else if(choice="Increment")
   {
	   input=parseInt(req.body["num"]);
	   output=input+1;   
   }
   res.render ( "inc2.ejs",{num:input, ans:output});
});
app.listen(3000 , function () {
	console.log ("server is listening!!!");
} );
