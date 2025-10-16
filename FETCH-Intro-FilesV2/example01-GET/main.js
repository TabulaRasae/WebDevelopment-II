const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
//app.use(bodyParser.json());
app.use(express.static("public"));

app.get('/sumdiff', (req, res) => 
{
  const {num1,num2}=req.query;
  console.log("num1="+num1);
  const sum = parseFloat(num1) + parseFloat(num2);
  const diff = parseFloat(num1) - parseFloat(num2);
  res.json({ sum, diff });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
