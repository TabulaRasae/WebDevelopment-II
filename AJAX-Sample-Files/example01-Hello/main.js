var express = require ('express'); 
var app = express(); 
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.get ("/hello.js", function (req,res) //DISPLAY FORM
{
  res.send("Hello From Ajax NodeJS"); 	
} );

app.listen(3000 , function () {
	console.log ("server is listening!!!");
} );
