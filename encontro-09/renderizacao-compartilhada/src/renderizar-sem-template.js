// Sem uma template, toda a estrutura, repetição e proteção contra injeção
// passam a ser responsabilidade deste código JavaScript.
function escaparHtml(valor) {
  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderizarItens(tarefas) {
  if (tarefas.length === 0) {
    return '<p class="estado-vazio">Nenhuma tarefa.</p>';
  }

  return `<ul class="tarefas">
    ${tarefas.map((tarefa) => `<li class="tarefa">
      <span class="marcador">${tarefa.concluida ? 'Concluída' : 'Pendente'}</span>
      <span${tarefa.concluida ? ' class="concluida"' : ''}>${escaparHtml(tarefa.titulo)}</span>
    </li>`).join('\n    ')}
  </ul>`;
}

export function renderizarSemTemplate(dados) {
  const titulo = escaparHtml(dados.tituloPagina);
  const explicacao = escaparHtml(dados.explicacao);

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${titulo} — sem template</title>
  <link rel="stylesheet" href="/estilos.css">
</head>
<body data-modo="manual">
  <a class="pular" href="#conteudo">Pular para o conteúdo</a>
  <header class="cabecalho">
    <a class="marca" href="/">WEB2 / Caderno 9</a>
    <nav aria-label="Comparar renderizações">
      <a href="/servidor-template">Servidor + EJS</a>
      <a href="/cliente-template">Cliente + EJS</a>
      <a aria-current="page" href="/sem-template">Servidor sem template</a>
    </nav>
  </header>
  <main id="conteudo" class="pagina">
    <section class="introducao">
      <p class="modo">HTML concatenado no servidor</p>
      <h1>${titulo}</h1>
      <p>${explicacao}</p>
    </section>
    <section class="resultado" aria-labelledby="titulo-lista">
      <div class="resultado-cabecalho">
        <h2 id="titulo-lista">Lista entregue pronta</h2>
        <span class="selo">sem .ejs</span>
      </div>
      ${renderizarItens(dados.tarefas)}
    </section>
    <aside class="rastro" aria-labelledby="titulo-rastro">
      <h2 id="titulo-rastro">Quem fez o trabalho?</h2>
      <ol>
        <li><strong>Servidor</strong><span>buscou as tarefas</span></li>
        <li><strong>Função JavaScript</strong><span>escapou cada valor e concatenou cada tag</span></li>
        <li><strong>Navegador</strong><span>recebeu a lista dentro do primeiro HTML</span></li>
      </ol>
      <p class="alerta"><strong>A dificuldade está no código:</strong> tags, condicionais, repetição e escaping ficaram misturados em uma grande string.</p>
    </aside>
  </main>
  <script type="module" src="/navegacao.js"></script>
</body>
</html>`;
}
