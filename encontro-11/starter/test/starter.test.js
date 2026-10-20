import test from 'node:test';
import assert from 'node:assert/strict';
import { criarSimulador } from '../simulador/app.js';
import { criarApp } from '../src/app.js';
import { criarCategoriasClient } from '../src/clients/categorias-client.js';

async function executar(app, teste) {
  const servidor = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    servidor.once('listening', resolve);
    servidor.once('error', reject);
  });
  try { await teste(`http://127.0.0.1:${servidor.address().port}`); }
  finally { await new Promise(resolve => servidor.close(resolve)); }
}

test('simulador fornece contrato remoto, 404 e contagem', async () => {
  await executar(criarSimulador(), async base => {
    assert.deepEqual(await (await fetch(base + '/categorias/1')).json(), {
      codigo: 1, descricao: 'Papelaria'
    });
    assert.equal((await fetch(base + '/categorias/999')).status, 404);
    assert.equal((await (await fetch(base + '/metricas')).json()).chamadas, 2);
  });
});

test('simulador produz 500 e JSON realmente inválido', async () => {
  await executar(criarSimulador({ modo: 'erro' }), async base => {
    assert.equal((await fetch(base + '/categorias/1')).status, 500);
  });
  await executar(criarSimulador({ modo: 'invalido' }), async base => {
    const resposta = await fetch(base + '/categorias/1');
    assert.equal(resposta.status, 200);
    await assert.rejects(() => resposta.json(), SyntaxError);
  });
});

test('modo lento permite reproduzir o timeout de 300 ms', async () => {
  await executar(criarSimulador({ modo: 'lento' }), async base => {
    await assert.rejects(() => fetch(base + '/categorias/1', {
      signal: AbortSignal.timeout(300)
    }), { name: 'TimeoutError' });
  });
});

test('catálogo lista produtos e sinaliza o exercício pendente', async () => {
  await executar(criarApp({
    categoriasClient: criarCategoriasClient({ baseUrl: 'http://localhost:4000', timeoutMs: 300 }),
    logger: { error() {} }
  }), async base => {
    assert.equal((await (await fetch(base + '/api/produtos')).json()).length, 3);
    const resposta = await fetch(base + '/api/produtos/1');
    assert.equal(resposta.status, 501);
    assert.equal((await resposta.json()).erro.codigo, 'EXERCICIO_PENDENTE');
    assert.ok(resposta.headers.get('X-Request-Id'));
  });
});
