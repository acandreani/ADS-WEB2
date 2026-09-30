import assert from 'node:assert/strict';
import test from 'node:test';
import { criarApp } from '../src/app.js';

async function comServidor(executar, opcoes) {
  const servidor = criarApp(opcoes).listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    servidor.once('listening', resolve);
    servidor.once('error', reject);
  });

  try {
    await executar(`http://127.0.0.1:${servidor.address().port}`);
  } finally {
    await new Promise((resolve, reject) => {
      servidor.close((erro) => erro ? reject(erro) : resolve());
    });
  }
}

test('SSR entrega tarefas já renderizadas no primeiro HTML', async () => {
  await comServidor(async (base) => {
    const resposta = await fetch(`${base}/servidor-template`);
    const html = await resposta.text();
    assert.equal(resposta.status, 200);
    assert.match(html, /Ler o código da rota/);
    assert.match(html, /Template executada no servidor/);
    assert.doesNotMatch(html, /renderizar-no-cliente\.js/);
  });
});

test('CSR entrega a casca e deixa dados para requisição posterior', async () => {
  await comServidor(async (base) => {
    const resposta = await fetch(`${base}/cliente-template`);
    const html = await resposta.text();
    assert.equal(resposta.status, 200);
    assert.match(html, /Buscando dados e template/);
    assert.match(html, /renderizar-no-cliente\.js/);
    assert.doesNotMatch(html, /Ler o código da rota/);
  });
});

test('o cliente recebe a mesma template que o servidor executa', async () => {
  await comServidor(async (base) => {
    const resposta = await fetch(`${base}/templates/tarefas-conteudo.ejs`);
    const template = await resposta.text();
    assert.equal(resposta.status, 200);
    assert.match(template, /<%= tituloPagina %>/);
    assert.match(template, /for \(const tarefa of tarefas\)/);
    assert.match(template, /modo === 'servidor'/);
  });
});

test('a API entrega ao CSR o mesmo conjunto de dados', async () => {
  await comServidor(async (base) => {
    const resposta = await fetch(`${base}/api/tarefas`);
    const tarefas = await resposta.json();
    assert.equal(resposta.status, 200);
    assert.equal(tarefas.length, 4);
    assert.equal(tarefas[0].titulo, 'Ler o código da rota');
  });
});

test('versão sem template monta HTML no servidor e escapa entrada', async () => {
  await comServidor(async (base) => {
    const resposta = await fetch(`${base}/sem-template`);
    const html = await resposta.text();
    assert.equal(resposta.status, 200);
    assert.match(html, /HTML concatenado no servidor/);
    assert.match(html, /&lt;script&gt;alert\(&quot;isto deve ser texto&quot;\)&lt;\/script&gt;/);
    assert.doesNotMatch(html, /<script>alert\("isto deve ser texto"\)<\/script>/);
  });
});

test('EJS e montagem manual escapam o mesmo dado não confiável', async () => {
  const tarefasService = {
    async listar() {
      return [{ id: 1, titulo: '<img src=x onerror=alert(1)>', concluida: false }];
    }
  };

  await comServidor(async (base) => {
    for (const rota of ['/servidor-template', '/sem-template']) {
      const html = await (await fetch(base + rota)).text();
      assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
      assert.doesNotMatch(html, /<img src=x onerror=alert\(1\)>/);
    }
  }, { tarefasService });
});
