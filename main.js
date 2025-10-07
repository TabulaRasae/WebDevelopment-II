const express = require("express");
const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.post("/ageInMonthsOnly", (req, res) => {
  console.log("server received request at /ageInMonthsOnly");
  const birthY = parseFloat(req.body.birthYear);
  const birthM = parseFloat(req.body.birthMonth);
  const currentY = parseFloat(req.body.currentYear);
  const currentM = parseFloat(req.body.currentMonth);

  if (isNaN(birthY) || isNaN(birthM) || isNaN(currentY) || isNaN(currentM)) {
    return res.status(400).send("Invalid input: All fields must be numbers.");
  }

  const ageInMonthsOnly = currentY * 12 + currentM - (birthY * 12 + birthM);
  res.status(200).send(ageInMonthsOnly.toString());
});

app.post("/ageInYearsOnly", (req, res) => {
  console.log("server received request at /ageInYearsOnly");
  const birthY = parseFloat(req.body.birthYear);
  const birthM = parseFloat(req.body.birthMonth);
  const currentY = parseFloat(req.body.currentYear);
  const currentM = parseFloat(req.body.currentMonth);

  if (isNaN(birthY) || isNaN(birthM) || isNaN(currentY) || isNaN(currentM)) {
    return res.status(400).send("Invalid input: All fields must be numbers.");
  }

  const ageInYearsOnly = Math.floor(
    (currentY * 12 + currentM - (birthY * 12 + birthM)) / 12
  );
  res.status(200).send(ageInYearsOnly.toString());
});

app.post("/ageInYearsAndMonths", (req, res) => {
  console.log("server received request at /ageInYearsAndMonths");
  const birthY = parseFloat(req.body.birthYear);
  const birthM = parseFloat(req.body.birthMonth);
  const currentY = parseFloat(req.body.currentYear);
  const currentM = parseFloat(req.body.currentMonth);

  if (isNaN(birthY) || isNaN(birthM) || isNaN(currentY) || isNaN(currentM)) {
    return res.status(400).send("Invalid input: All fields must be numbers.");
  }

  const years = parseInt(
    (currentY * 12 + currentM - (birthY * 12 + birthM)) / 12
  );
  const months = (currentY * 12 + currentM - (birthY * 12 + birthM)) % 12;
  const ageInYearsAndMonths = `${years} ${months}`;
  res.status(200).send(ageInYearsAndMonths);
});

app.listen(3000, () => {
  console.log("server is started at the port 3000");
});
