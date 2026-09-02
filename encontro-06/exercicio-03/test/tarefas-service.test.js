import assert from 'node:assert/strict';
import test from 'node:test';

import { ErroValidacao } from '../src/errors/erro-validacao.js';
import { criarTarefasRepository }
  from '../src/repositories/tarefas-memory.js';
import { criarTarefasService }
  from '../src/services/tarefas-service.js';

function criarCenario() {
  const repository = criarTarefasRepository();
  const service = criarTarefasService(repository);
  return { repository, service };
}

test('atualiza e normaliza o título', async () => {
  const { service } = criarCenario();

  const tarefa = await service.atualizar(1, {
    titulo: '  Estudar services  '
  });

  assert.deepEqual(tarefa, {
    id: 1,
    titulo: 'Estudar services',
    concluida: false
  });
});

test('atualiza somente o estado de conclusão', async () => {
  const { service } = criarCenario();

  const tarefa = await service.atualizar(1, {
    concluida: true
  });

  assert.equal(tarefa.concluida, true);
  assert.equal(tarefa.titulo, 'Estudar arquitetura');
});

test('devolve null quando a tarefa não existe', async () => {
  const { service } = criarCenario();

  const resultado = await service.atualizar(999, {
    concluida: true
  });

  assert.equal(resultado, null);
});

test('rejeita título vazio', async () => {
  const { service } = criarCenario();

  await assert.rejects(
    service.atualizar(1, { titulo: '   ' }),
    ErroValidacao
  );
});

test('rejeita concluida que não seja booleano', async () => {
  const { service } = criarCenario();

  await assert.rejects(
    service.atualizar(1, { concluida: 'true' }),
    ErroValidacao
  );
});

test('rejeita atualização sem campos permitidos', async () => {
  const { service } = criarCenario();

  await assert.rejects(
    service.atualizar(1, { id: 50 }),
    ErroValidacao
  );
});

test('repository preserva o identificador original', async () => {
  const { repository } = criarCenario();

  const tarefa = await repository.atualizar(1, {
    id: 50,
    titulo: 'Novo título'
  });

  assert.equal(tarefa.id, 1);
  assert.equal(tarefa.titulo, 'Novo título');
});
