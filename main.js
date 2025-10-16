const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());
app.use(express.static("public"));

const getLetterGrade = (numericGrade) => {
  if (numericGrade >= 90) return "A";
  if (numericGrade >= 80) return "B";
  if (numericGrade >= 70) return "C";
  if (numericGrade >= 60) return "D";
  return "F";
};

app.get("/fallGrade", (req, res) => {
  const midterm = parseFloat(req.query.midterm);
  const final = parseFloat(req.query.final);
  const grade = (2*midterm + final)/3;
  const letter = getLetterGrade(grade);
  res.json({ grade: grade.toFixed(2), letter: letter });
});

app.get("/springGrade", (req, res) => {
  const midterm = parseFloat(req.query.midterm);
  const final = parseFloat(req.query.final);
  const grade = midterm * 0.5 + final * 0.5;
  const letter = getLetterGrade(grade);
  res.json({ grade: grade.toFixed(2), letter: letter });
});

app.get("/summerGrade", (req, res) => {
  const midterm = parseFloat(req.query.midterm);
  const final = parseFloat(req.query.final);
  const grade = midterm * 0.3 + final * 0.7;
  const letter = getLetterGrade(grade);
  res.json({ grade: grade.toFixed(2), letter: letter });
});

app.listen(3000, () => {
  console.log(`Server is running on port 3000`);
});
