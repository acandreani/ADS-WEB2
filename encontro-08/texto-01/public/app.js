const form = document.querySelector('#form-tarefa');
const titulo = document.querySelector('#titulo');
const botao = document.querySelector('#botao-adicionar');
const mensagem = document.querySelector('#mensagem');
const lista = document.querySelector('#lista');

function mostrarMensagem(texto, tipo = 'normal') {
  mensagem.textContent = texto;
  mensagem.dataset.tipo = tipo;
}

function renderizar(tarefas) {
  lista.replaceChildren();

  for (const tarefa of tarefas) {
    const item = document.createElement('li');
    // Títulos são dados, não HTML executável.
    item.textContent = tarefa.titulo;
    lista.append(item);
  }
}

async function lerJson(resposta) {
  const tipo = resposta.headers.get('content-type') ?? '';
  if (!tipo.includes('application/json')) {
    throw new Error('O servidor não retornou JSON');
  }
  return resposta.json();
}

async function carregarTarefas() {
  mostrarMensagem('Carregando tarefas...');
  try {
    const resposta = await fetch('/tarefas');
    const tarefas = await lerJson(resposta);
    if (!resposta.ok) {
      throw new Error(tarefas.mensagem ?? 'Falha ao carregar tarefas');
    }
    renderizar(tarefas);
    mostrarMensagem(tarefas.length === 0 ? 'Nenhuma tarefa cadastrada.' : '');
  } catch (erro) {
    mostrarMensagem(erro.message, 'erro');
  }
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (!form.reportValidity()) return;

  botao.disabled = true;
  mostrarMensagem('Salvando...');

  try {
    const resposta = await fetch('/tarefas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: titulo.value })
    });
    const dados = await lerJson(resposta);
    if (!resposta.ok) {
      throw new Error(dados.mensagem ?? 'Falha ao salvar');
    }
    titulo.value = '';
    await carregarTarefas();
    if (mensagem.dataset.tipo !== 'erro') {
      mostrarMensagem(`Tarefa ${dados.id} criada.`);
    }
  } catch (erro) {
    mostrarMensagem(erro.message, 'erro');
  } finally {
    botao.disabled = false;
  }
});

await carregarTarefas();
