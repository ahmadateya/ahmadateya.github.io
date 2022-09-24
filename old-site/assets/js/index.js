if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.body.classList.add("dark")
}
window.onload = (event) => {
  var elements = document.getElementsByClassName('level-bar-inner')
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].dataset.level === 'no-level') {
        elements[i].parentElement.classList.remove('level-bar ');
        continue;
    }
    elements[i].style.width = elements[i].dataset.level*50 + 'px'
  }
}
