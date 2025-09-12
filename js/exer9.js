function display() {
  let a = document.getElementById('A');
  if (!a) {
    a = document.createElement('div');
    a.id = 'A';
    a.textContent = 'Hello';
    document.body.appendChild(a);
  }

  const span = document.createElement('span');
  span.id = a.id;              
  span.textContent = 'Hello2'; 

  a.replaceWith(span);
}