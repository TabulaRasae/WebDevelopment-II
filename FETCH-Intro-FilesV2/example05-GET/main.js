const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(express.static("public"));

app.get('/sumdiff', (req, res) => 
{
  const sum = parseFloat(req.query.num1) + parseFloat(req.query.num2);
  const diff = parseFloat(req.query.num1) - parseFloat(req.query.num2);
  res.json({ sum , diff });
});

app.listen(3000, () => {
  console.log(`Server is running on port 3000`);
});
