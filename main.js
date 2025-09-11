const port = 3000;
const express = require("express");
const app = express();

app
  .get("/", (req, res) => {
    res.send("Hello, World");
  })
  .listen(port, () => {
    console.log(`server started at port ${port}...`);
  });
  