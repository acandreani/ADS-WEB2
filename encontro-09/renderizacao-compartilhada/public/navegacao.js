const links = document.querySelectorAll('.cabecalho nav a');

for (const link of links) {
  link.addEventListener('click', () => link.setAttribute('aria-busy', 'true'));
}
