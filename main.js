var express = require("express");
var app = express();
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/sum", function (req, res) {
  let ans = parseFloat(req.query.num1) + parseFloat(req.query.num2);
  res.status().send(ans.toString());
});
app.listen(3000, function () {
  console.log("server is listening!!!");
});
