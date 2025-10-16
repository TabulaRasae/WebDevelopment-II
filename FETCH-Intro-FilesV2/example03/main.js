const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(express.static("public"));

app.post('/sumdiff', (req, res) => 
{
  const {num1,num2}=req.body;
  const sum = parseFloat(num1) + parseFloat(num2);
  const diff = parseFloat(num1) - parseFloat(num2);
  res.json({ sum , diff });
});

app.listen(3000, () => {
  console.log(`Server is running on port 3000`);
});
