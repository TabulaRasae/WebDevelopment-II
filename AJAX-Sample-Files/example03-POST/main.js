var express = require ('express'); 
var app = express(); 
app.use(express.static("public"));
app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.post ("/sum2.js", function (req,res)
{
  let ans=parseFloat(req.body.num1)+parseFloat(req.body.num2);
  res.status(200);
  res.send(ans.toString()); 	
} );

app.listen(3000 , function () {
	console.log ("server is listening!!!");
} );
