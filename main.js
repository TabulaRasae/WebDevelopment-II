"use strict";

const port = 3000,
  express = require("express"),
  app = express();

app.use(express.static("public"));

app.use(
  express.urlencoded({
    extended: false,
  })
);

app.get("/rectangle.js", (req, res) => {
  let choice = req.query.choice;
  let len = req.query.num1;
  let wid = req.query.num2;
  let area = parseFloat(len)*parseFloat(wid);
  let perimeter = parseFloat(len)*2+parseFloat(wid)*2;
  let output = '<br><a href="rectangle.html">Go back to rectangle</a>';

  // I'm practicing newer one line ternary operators
  choice === "Area" ? res.send("Area: " + area.toString() +output) : null;
  choice === "Perimeter" ? res.send("Perimeter: " + perimeter.toString()+output) : null;
  choice === "Both" ? res.send("Area: " + area.toString() +"<br>" + "Perimeter: " + perimeter.toString()+output) : null;


});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
