var express = require("express");
var app = express();
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/sum.js", function (req, res) {
  let ans = parseFloat(req.query.num1) + parseFloat(req.query.num2);
  res.status(200);
  res.send(ans.toString());
});

app.listen(3000, function () {
  coonsole.log("server is listening!!!");
});
