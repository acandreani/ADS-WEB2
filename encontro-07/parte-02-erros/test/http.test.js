import assert from 'node:assert/strict';
import test from 'node:test';

import { criarApp } from '../src/app.js';

async function comServidor(opcoes, executar) {
  const app = criarApp(opcoes);
  const servidor = app.listen(0, '127.0.0.1');

  await new Promise((resolve, reject) => {
    servidor.once('listening', resolve);
    servidor.once('error', reject);
  });

  const { port } = servidor.address();

  try {
    await executar(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      servidor.close((erro) => erro ? reject(erro) : resolve());
    });
  }
}

test('cria tarefa e envia Location e request ID', async () => {
  await comServidor({}, async (baseUrl) => {
    const resposta = await fetch(`${baseUrl}/tarefas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Estudar middleware' })
    });

    assert.equal(resposta.status, 201);
    assert.equal(resposta.headers.get('location'), '/tarefas/1');
    assert.ok(resposta.headers.get('x-request-id'));

    assert.deepEqual(await resposta.json(), {
      id: 1,
      titulo: 'Estudar middleware',
      concluida: false
    });
  });
});

test('retorna 400 com todos os erros por campo', async () => {
  await comServidor({}, async (baseUrl) => {
    const resposta = await fetch(`${baseUrl}/tarefas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'ab', concluida: 'false' })
    });
    const corpo = await resposta.json();

    assert.equal(resposta.status, 400);
    assert.equal(corpo.codigo, 'VALIDACAO_FALHOU');
    assert.deepEqual(corpo.detalhes, {
      titulo: 'Deve conter de 3 a 120 caracteres',
      concluida: 'Deve ser booleano'
    });
    assert.ok(corpo.requestId);
  });
});

test('retorna 409 para título ativo duplicado', async () => {
  await comServidor({}, async (baseUrl) => {
    const requisicao = (titulo) => fetch(`${baseUrl}/tarefas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo })
    });

    assert.equal((await requisicao('Estudar erros')).status, 201);

    const resposta = await requisicao('  ESTUDAR ERROS  ');
    const corpo = await resposta.json();

    assert.equal(resposta.status, 409);
    assert.equal(corpo.codigo, 'TITULO_DUPLICADO');
  });
});

test('distingue ID inválido de tarefa ausente', async () => {
  await comServidor({}, async (baseUrl) => {
    const idInvalido = await fetch(`${baseUrl}/tarefas/12abc`);
    const ausente = await fetch(`${baseUrl}/tarefas/999`);

    assert.equal(idInvalido.status, 400);
    assert.equal((await idInvalido.json()).codigo, 'ID_INVALIDO');
    assert.equal(ausente.status, 404);
    assert.equal(
      (await ausente.json()).codigo,
      'TAREFA_NAO_ENCONTRADA'
    );
  });
});

test('converte JSON malformado para o formato padrão', async () => {
  await comServidor({}, async (baseUrl) => {
    const resposta = await fetch(`${baseUrl}/tarefas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"titulo":"Incompleto"'
    });
    const corpo = await resposta.json();

    assert.equal(resposta.status, 400);
    assert.equal(corpo.codigo, 'JSON_INVALIDO');
    assert.equal(corpo.mensagem, 'O corpo contém JSON malformado');
    assert.ok(corpo.requestId);
  });
});

test('404 de rota também contém request ID', async () => {
  await comServidor({}, async (baseUrl) => {
    const resposta = await fetch(`${baseUrl}/rota-inexistente`);
    const corpo = await resposta.json();

    assert.equal(resposta.status, 404);
    assert.equal(corpo.codigo, 'ROTA_NAO_ENCONTRADA');
    assert.ok(corpo.requestId);
  });
});

test('erro inesperado não vaza segredo e gera log interno', async () => {
  const registros = [];
  const logger = {
    error(registro) {
      registros.push(registro);
    }
  };

  await comServidor({
    habilitarRotaDebug: true,
    logger
  }, async (baseUrl) => {
    const resposta = await fetch(`${baseUrl}/debug/erro`);
    const corpoEmTexto = await resposta.text();
    const corpo = JSON.parse(corpoEmTexto);

    assert.equal(resposta.status, 500);
    assert.equal(corpo.codigo, 'ERRO_INTERNO');
    assert.ok(corpo.requestId);
    assert.equal(corpoEmTexto.includes('senha-db=segredo'), false);

    assert.equal(registros.length, 1);
    assert.equal(registros[0].requestId, corpo.requestId);
    assert.equal(registros[0].mensagem, 'senha-db=segredo');
    assert.match(registros[0].stack, /senha-db=segredo/);
  });
});
