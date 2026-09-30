const destino = document.querySelector('#view');

async function buscarTexto(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Falha ao buscar ${url}: HTTP ${resposta.status}`);
  return resposta.text();
}

async function buscarJson(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Falha ao buscar ${url}: HTTP ${resposta.status}`);
  return resposta.json();
}

try {
  // As duas requisições são independentes e podem ocorrer em paralelo.
  const [template, tarefas] = await Promise.all([
    buscarTexto('/templates/tarefas-conteudo.ejs'),
    buscarJson('/api/tarefas')
  ]);

  const dados = {
    tituloPagina: 'Minhas tarefas',
    explicacao: 'Os mesmos dados e a mesma estrutura visual, produzidos em lugares diferentes.',
    modo: 'cliente',
    tarefas
  };

  // window.ejs veio de /vendor/ejs.min.js. A tag <%= ... %> da template
  // escapa os valores recebidos antes de produzir a string HTML.
  const html = window.ejs.render(template, dados);
  destino.innerHTML = html;
  document.dispatchEvent(new CustomEvent('view:pronta'));
} catch (erro) {
  destino.innerHTML = '';
  const aviso = document.createElement('p');
  aviso.className = 'erro';
  aviso.role = 'alert';
  aviso.textContent = `${erro.message}. Recarregue a página para tentar novamente.`;
  destino.append(aviso);
}
