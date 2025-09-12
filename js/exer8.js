function display() {
  let a = document.getElementById('A');
  if (!a) {
    a = document.createElement('div');
    a.id = 'A';
    document.body.appendChild(a);
  }

  a.textContent = 'Hello';
  a.style.display = 'block';
}