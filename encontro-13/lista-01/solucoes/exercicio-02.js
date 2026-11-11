import assert from 'node:assert/strict';
import { abrirBanco, inicializarBanco } from '../src/db.js';
import { criarTarefasSqlite } from '../src/repositories/sqlite.js';

const db = abrirBanco(':memory:');
try {
  inicializarBanco(db);
  const r = criarTarefasSqlite(db);
  const tarefa = await r.inserir({ titulo: 'Estudar SQL', concluida: false, usuarioId: 1 });
  console.log('INSERT:', tarefa);
  console.log('SELECT por ID:', await r.buscarPorId(tarefa.id));
  console.log('SELECT por usuário:', await r.listarPorUsuario(1));
  const concluida = await r.atualizar(tarefa.id, 1, { concluida: true });
  assert.equal(concluida.titulo, tarefa.titulo);
  console.log('PATCH só concluida:', concluida);
  const renomeada = await r.atualizar(tarefa.id, 1, { titulo: "Revisar 'parametros'" });
  assert.equal(renomeada.concluida, true);
  console.log('PATCH só titulo:', renomeada);
  assert.equal((await r.atualizar(tarefa.id, 1, { concluida: false })).concluida, false);
  assert.equal(await r.remover(tarefa.id, 2), false);
  assert.equal(await r.remover(tarefa.id, 1), true);
  assert.equal(await r.buscarPorId(tarefa.id), null);
  console.log('DELETE: proprietário correto remove; busca posterior retorna null.');
} finally { db.close(); }
