import assert from 'node:assert/strict';
import { criarTarefasRepository } from '../src/repositories/memoria.js';
import { criarTarefasSqlite } from '../src/repositories/sqlite.js';
import { abrirBanco, inicializarBanco } from '../src/db.js';

const agora = () => '2026-11-11T12:00:00.000Z';
const db = abrirBanco(':memory:');
try {
  inicializarBanco(db);
  const resultados = [];
  for (const [tipo, repository] of [
    ['memoria', criarTarefasRepository({ agora })],
    ['sqlite', criarTarefasSqlite(db, { agora })]
  ]) {
    assert.equal(await repository.buscarPorId(999), null);
    assert.deepEqual(await repository.listarPorUsuario(1), []);
    const tarefa = await repository.inserir({ titulo: 'Contrato comum', concluida: false, usuarioId: 1 });
    const atualizada = await repository.atualizar(tarefa.id, 1, { concluida: true });
    const alheia = await repository.atualizar(tarefa.id, 2, { titulo: 'Proibida' });
    const removida = await repository.remover(tarefa.id, 1);
    const novamente = await repository.remover(tarefa.id, 1);
    const resultado = { tarefa, atualizada, alheia, removida, novamente };
    resultados.push(resultado);
    console.log(tipo, resultado);
  }
  assert.deepEqual(resultados[0], resultados[1]);
  console.log('OK: mesmas operações, mesmos retornos, mesmo contrato.');
} finally { db.close(); }
