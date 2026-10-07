import test from 'node:test';
import assert from 'node:assert/strict';
import { criarApp } from '../src/app.js';

test('starter inicia com 27 tarefas e oferece consulta e erros HTTP', async () => {
  const servidor = criarApp().listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    servidor.once('listening', resolve);
    servidor.once('error', reject);
  });
  const base = `http://127.0.0.1:${servidor.address().port}`;
  try {
    const resposta = await fetch(`${base}/tarefas`);
    assert.equal(resposta.status, 200);
    const tarefas = await resposta.json();
    assert.equal(tarefas.length, 27);
    assert.equal(new Set(tarefas.map(t => t.id)).size, 27);
    assert.ok(tarefas.some(t => t.concluida));
    assert.ok(tarefas.some(t => !t.concluida));
    for (const tarefa of tarefas) {
      assert.equal(typeof tarefa.titulo, 'string');
      assert.equal(typeof tarefa.concluida, 'boolean');
      assert.ok(Number.isInteger(tarefa.usuarioId));
      assert.equal(typeof tarefa.notaInterna, 'string');
      assert.equal(new Date(tarefa.criadoEm).toISOString(), tarefa.criadoEm);
    }
    assert.equal((await (await fetch(`${base}/tarefas/1`)).json()).id, 1);
    assert.equal((await fetch(`${base}/tarefas/999`)).status, 404);
    assert.equal((await fetch(`${base}/tarefas/abc`)).status, 400);
    assert.equal((await fetch(`${base}/inexistente`)).status, 404);
  } finally {
    await new Promise(resolve => servidor.close(resolve));
  }
});
