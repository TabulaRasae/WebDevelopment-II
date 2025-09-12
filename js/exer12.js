function display() {
  const dog = document.querySelector(".dog");
  if (dog) dog.classList.replace("dog", "Cat");
  dog.textContent = dog.className + " class says meow";
  console.log(dog.className);
  console.log("Meow");

  const fish = document.querySelector(".fish");
  if (fish) {
    fish.remove();
  }
}
