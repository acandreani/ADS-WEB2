import assert from 'node:assert/strict';
import test from 'node:test';
import { criarApp } from '../src/app.js';

async function comServidor(executar) {
  const servidor = criarApp().listen(0, '127.0.0.1');
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

test('serve HTML, CSS e JavaScript', async () => {
  await comServidor(async (base) => {
    for (const caminho of ['/', '/estilos.css', '/app.js']) {
      const resposta = await fetch(base + caminho);
      assert.equal(resposta.status, 200);
      assert.ok((await resposta.text()).length > 0);
    }
  });
});

test('cria e lista tarefa pelos dois caminhos do material', async () => {
  await comServidor(async (base) => {
    const criar = await fetch(base + '/tarefas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: '  Estudar Fetch  ' })
    });
    assert.equal(criar.status, 201);
    assert.equal(criar.headers.get('location'), '/tarefas/1');
    assert.deepEqual(await criar.json(), {
      id: 1, titulo: 'Estudar Fetch', concluida: false
    });

    const listar = await fetch(base + '/api/tarefas');
    assert.deepEqual(await listar.json(), [
      { id: 1, titulo: 'Estudar Fetch', concluida: false }
    ]);
  });
});

test('rejeita título inválido com mensagem para a interface', async () => {
  await comServidor(async (base) => {
    const resposta = await fetch(base + '/tarefas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'ab' })
    });
    assert.equal(resposta.status, 400);
    assert.match((await resposta.json()).mensagem, /título/);
  });
});

test('starter permite concluir e excluir tarefa', async () => {
  await comServidor(async (base) => {
    await fetch(base + '/tarefas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Concluir tarefa' })
    });
    const alterar = await fetch(base + '/api/tarefas/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concluida: true })
    });
    assert.equal(alterar.status, 200);
    assert.equal((await alterar.json()).concluida, true);

    const remover = await fetch(base + '/tarefas/1', { method: 'DELETE' });
    assert.equal(remover.status, 204);
    assert.deepEqual(await (await fetch(base + '/tarefas')).json(), []);
  });
});
