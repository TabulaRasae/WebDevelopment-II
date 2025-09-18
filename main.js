var express = require ('express'); 
var app = express(); 
app.use(express.static("public"));
app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.use((req, res, next) => 
{
  console.log(`request made to: ${req.url}`);
  next();
});

app.get ("/sum.js", function (req,res)
{
  let ans=parseFloat(req.query.num1)+parseFloat(req.query.num2);
  ans=""+ans;
  res.status(200);
  res.send(ans); 	
} );

app.listen(3000 , function () {
	console.log ("server is listening!!!");
} );
