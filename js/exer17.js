document.body.innerHTML = "";

const panel = document.createElement("div");
panel.className = "panel";

const title = document.createElement("h1");
title.textContent = "INC PROBLEM";

const lblVal = document.createElement("label");
lblVal.htmlFor = "val";
lblVal.textContent = "Enter Value:";
const inpVal = document.createElement("input");
inpVal.type = "number";
inpVal.id = "val";

const row1 = document.createElement("div");
row1.className = "row";
row1.append(lblVal, inpVal);

const lblAns = document.createElement("label");
lblAns.htmlFor = "ans";
lblAns.textContent = "Answer:";
const inpAns = document.createElement("input");
inpAns.type = "text";
inpAns.id = "ans";
inpAns.readOnly = true;

const row2 = document.createElement("div");
row2.className = "row";
row2.append(lblAns, inpAns);

const btnEnter = document.createElement("button");
btnEnter.id = "bEnter";
btnEnter.textContent = "ENTER";
const btnClear = document.createElement("button");
btnClear.id = "bClear";
btnClear.textContent = "CLEAR";

const btnRow = document.createElement("div");
btnRow.className = "buttons";
btnRow.append(btnEnter, btnClear);

panel.append(title, row1, row2, btnRow);
document.body.append(panel);

btnEnter.onclick = () => {
  const n = parseFloat(inpVal.value);
  if (Number.isNaN(n)) {
    inpAns.value = "";
    alert("Please enter a number.");
    inpVal.focus();
    return;
  }
  inpAns.value = n + 1;
};
btnClear.onclick = () => {
  inpVal.value = "";
  inpAns.value = "";
  inpVal.focus();
};
inpVal.focus();
