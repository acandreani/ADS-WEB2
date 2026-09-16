import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');

function json(dados, status = 200) {
  return Response.json(dados, { status });
}

async function esperar(condicao) {
  for (let tentativa = 0; tentativa < 50; tentativa++) {
    if (condicao()) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  assert.fail('A interface não chegou ao estado esperado');
}

test('exercício 2: carregamento, vazio, resultado e botão desabilitado', async () => {
  const documentoAnterior = globalThis.document;
  const fetchAnterior = globalThis.fetch;
  const dom = new JSDOM(html, { url: 'http://localhost/' });
  globalThis.document = dom.window.document;

  let resolverGet;
  let resolverPost;
  const tarefas = [{ id: 1, titulo: 'Estudar Fetch', concluida: false }];
  let chamadasGet = 0;
  globalThis.fetch = (url, opcoes = {}) => {
    if (url === '/tarefas' && opcoes.method === 'POST') {
      return new Promise((resolve) => { resolverPost = resolve; });
    }
    if (url === '/tarefas') {
      chamadasGet++;
      if (chamadasGet === 1) {
        return new Promise((resolve) => { resolverGet = resolve; });
      }
      return Promise.resolve(json(tarefas));
    }
    throw new Error(`Requisição inesperada: ${url}`);
  };

  try {
    const modulo = import('../public/app.js?teste=estados');
    await esperar(() => typeof resolverGet === 'function');
    assert.match(document.querySelector('#mensagem').textContent, /Carregando/);
    resolverGet(json([]));
    await modulo;
    assert.match(document.querySelector('#mensagem').textContent, /Nenhuma tarefa/);

    document.querySelector('#titulo').value = 'Estudar Fetch';
    document.querySelector('#form-tarefa').dispatchEvent(
      new dom.window.Event('submit', { bubbles: true, cancelable: true })
    );
    await esperar(() => typeof resolverPost === 'function');
    assert.equal(document.querySelector('#botao-adicionar').disabled, true);
    resolverPost(json(tarefas[0], 201));
    await esperar(() => !document.querySelector('#botao-adicionar').disabled);
    assert.equal(document.querySelectorAll('#lista li').length, 1);
    assert.match(document.querySelector('#lista').textContent, /Estudar Fetch/);
  } finally {
    globalThis.document = documentoAnterior;
    globalThis.fetch = fetchAnterior;
    dom.window.close();
  }
});

test('exercício 2: falha na listagem aparece na tela', async () => {
  const documentoAnterior = globalThis.document;
  const fetchAnterior = globalThis.fetch;
  const dom = new JSDOM(html, { url: 'http://localhost/' });
  globalThis.document = dom.window.document;
  globalThis.fetch = async () => { throw new Error('Rede indisponível'); };

  try {
    await import('../public/app.js?teste=falha');
    assert.equal(document.querySelector('#mensagem').dataset.tipo, 'erro');
    assert.match(document.querySelector('#mensagem').textContent, /Rede indisponível/);
    assert.equal(document.querySelectorAll('#lista li').length, 0);
  } finally {
    globalThis.document = documentoAnterior;
    globalThis.fetch = fetchAnterior;
    dom.window.close();
  }
});

test('exercício 3: falha no PATCH reverte o checkbox e mostra erro', async () => {
  const documentoAnterior = globalThis.document;
  const fetchAnterior = globalThis.fetch;
  const dom = new JSDOM(html, { url: 'http://localhost/' });
  globalThis.document = dom.window.document;
  const tarefa = { id: 7, titulo: 'Testar checkbox', concluida: false };
  let resolverPatch;
  globalThis.fetch = (url, opcoes = {}) => {
    if (url === '/tarefas' && !opcoes.method) return Promise.resolve(json([tarefa]));
    if (url === '/tarefas/7' && opcoes.method === 'PATCH') {
      assert.deepEqual(JSON.parse(opcoes.body), { concluida: true });
      return new Promise((resolve) => { resolverPatch = resolve; });
    }
    throw new Error(`Requisição inesperada: ${url}`);
  };

  try {
    await import('../public/app.js?teste=patch');
    const checkbox = document.querySelector('#lista input[type="checkbox"]');
    assert.ok(checkbox);
    checkbox.checked = true;
    checkbox.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    await esperar(() => typeof resolverPatch === 'function');
    assert.equal(checkbox.disabled, true);
    resolverPatch(json({ mensagem: 'Atualização recusada' }, 409));
    await esperar(() => !checkbox.disabled);
    assert.equal(checkbox.checked, false);
    assert.equal(document.querySelector('#mensagem').dataset.tipo, 'erro');
    assert.match(document.querySelector('#mensagem').textContent, /Atualização recusada/);
  } finally {
    globalThis.document = documentoAnterior;
    globalThis.fetch = fetchAnterior;
    dom.window.close();
  }
});
