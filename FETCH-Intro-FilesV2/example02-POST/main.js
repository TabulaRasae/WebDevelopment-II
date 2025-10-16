const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
//app.use(bodyParser.json());
app.use(express.static("public"));

app.post('/sumdiff', (req, res) => 
{
  const {num1,num2}=req.body;
  const sum = parseFloat(num1) + parseFloat(num2);
  const diff = parseFloat(num1) - parseFloat(num2);
  res.json({ sum,diff });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
