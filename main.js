const express = require ('express');
const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({extended:false}));
app.use(express.json());

app.post ("/ageInMonthsOnly", (req,res) =>
{
    console.log("server received request at /ageInMonthsOnly")
    const birthY =
    const birthM =
    const currentY =
    const currentM =

    const ans =
    res.status(200).send(ans.toString());
});

app.listen(3000, () =>
{
    console.log ("server is started at the port 3000")
});