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

app.get ("/area", (req,res) =>
{
  let ans=parseFloat(req.query.length)*parseFloat(req.query.width);
  area=""+ans;
  res.status(200);
  res.send(area); 	
} );

app.get ("/perimeter", (req,res) =>
{
  let ans=(parseFloat(req.query.length)*2)+(parseFloat(req.query.width)*2);
  perimeter=""+ans;
  res.status(200);
  res.send(perimeter); 	
} );

app.get ("/both", (req,res) => {
    let area = parseFloat(req.query.length)*parseFloat(req.query.width);
    let perimeter =(parseFloat(req.query.length)*2)+(parseFloat(req.query.width)*2);
    res.status(200);
    res.send(`${area} ${perimeter}`)
})


app.listen(3000 ,  () => {
	console.log ("server is running on http://localhost:3000");
} );
