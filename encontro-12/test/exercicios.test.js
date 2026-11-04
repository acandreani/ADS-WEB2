import test from 'node:test';
import assert from 'node:assert/strict';
import { bancoDescartavel } from '../lib/banco.js';
import { verificarRestricoes, casos } from '../solucoes/exercicio-01/index.js';
import { listarSegundaPagina } from '../solucoes/exercicio-02/index.js';
import { resumirUsuarios } from '../solucoes/exercicio-03/index.js';
import { atualizarTitulo } from '../solucoes/exercicio-04/index.js';
import { comparar } from '../solucoes/exercicio-05/index.js';
import { criarHistorico, concluirComHistorico } from '../solucoes/exercicio-06/index.js';

function banco(t, extras = false) {
  const db = bancoDescartavel({ extras });
  t.after(() => db.close());
  return db;
}
test('prática: dois usuários, quatro tarefas e FK ativa', t => {
  const db = banco(t);
  assert.equal(db.prepare('SELECT count(*) AS n FROM usuarios').get().n, 2);
  assert.equal(db.prepare('SELECT count(*) AS n FROM tarefas').get().n, 4);
  assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
});
test('ex1: todas as 15 inserções inválidas falham pela restrição esperada', t => {
  const db = banco(t);
  assert.equal(verificarRestricoes(db).length, casos.length);
  assert.equal(db.prepare('SELECT count(*) AS n FROM tarefas').get().n, 4);
});
test('títulos nos limites 3 e 120 são aceitos; defaults são preenchidos', t => {
  const db = banco(t);
  for (const titulo of ['abc', 'a'.repeat(120)]) {
    const r = db.prepare('INSERT INTO tarefas (titulo,usuario_id) VALUES (?,?)').run(titulo, 1);
    const row = db.prepare('SELECT * FROM tarefas WHERE id = ?').get(r.lastInsertRowid);
    assert.equal(row.concluida, 0);
    assert.match(row.criado_em, /^\d{4}-\d{2}-\d{2} /);
  }
});
test('ON DELETE CASCADE remove apenas tarefas do usuário removido', t => {
  const db = banco(t);
  db.prepare('DELETE FROM usuarios WHERE id = ?').run(1);
  assert.deepEqual(db.prepare('SELECT id FROM tarefas ORDER BY id').all().map(r => r.id), [3, 4]);
});
test('ex2: segunda página com cinco resultados e IDs esperados', t => {
  const db = banco(t, true);
  const linhas = listarSegundaPagina(db, 1, 'sQl');
  assert.deepEqual(linhas.map(r => r.id), [9, 10, 11, 12, 13]);
  assert.ok(linhas.every(r => r.concluida === 0));
});
test('ex2: filtro do proprietário e termo sem correspondência', t => {
  const db = banco(t, true);
  assert.equal(listarSegundaPagina(db, 2, 'sql').length, 0);
  assert.equal(listarSegundaPagina(db, 1, 'inexistente').length, 0);
  assert.equal(listarSegundaPagina(db, 1, "' OR 1=1 --").length, 0);
});
test('ex2: empate no título usa ID como desempate', t => {
  const db = banco(t);
  const ids = [];
  for (let i = 0; i < 7; i++) ids.push(db.prepare('INSERT INTO tarefas (titulo,usuario_id) VALUES (?,?)').run('Mesmo titulo', 1).lastInsertRowid);
  assert.deepEqual(listarSegundaPagina(db, 1, 'Mesmo').map(r => r.id), ids.slice(5));
});
test('ex3: inclui Carla e não conta a linha vazia do LEFT JOIN', t => {
  const db = banco(t, true);
  assert.deepEqual(resumirUsuarios(db).map(r => ({ ...r })), [
    { id: 1, nome: 'Ada', total: 12, concluidas: 1 },
    { id: 2, nome: 'Bruno', total: 2, concluidas: 0 },
    { id: 3, nome: 'Carla', total: 0, concluidas: 0 }
  ]);
});
test('ex4: proprietário pode atualizar', t => {
  const db = banco(t);
  assert.equal(atualizarTitulo(db, { id: 1, usuarioId: 1, titulo: 'Novo titulo' }).status, 200);
  assert.equal(db.prepare('SELECT titulo FROM tarefas WHERE id = 1').get().titulo, 'Novo titulo');
});
test('ex4: alheio e inexistente têm a mesma resposta; estado é preservado', t => {
  const db = banco(t);
  const antes = db.prepare('SELECT * FROM tarefas').all();
  const alheio = atualizarTitulo(db, { id: 1, usuarioId: 2, titulo: 'Alteracao proibida' });
  const ausente = atualizarTitulo(db, { id: 999, usuarioId: 2, titulo: 'Alteracao ausente' });
  assert.deepEqual(alheio, ausente);
  assert.equal(alheio.status, 404);
  assert.deepEqual(db.prepare('SELECT * FROM tarefas').all(), antes);
});
test('ex4: parâmetro mantém aspas como parte do título', t => {
  const db = banco(t);
  const titulo = "Revisar 'SQL'; -- texto";
  atualizarTitulo(db, { id: 1, usuarioId: 1, titulo });
  assert.equal(db.prepare('SELECT titulo FROM tarefas WHERE id = 1').get().titulo, titulo);
});
test('ex4: título inválido continua protegido pelo CHECK', t => {
  const db = banco(t);
  assert.throws(() => atualizarTitulo(db, { id: 1, usuarioId: 1, titulo: 'a' }), /CHECK/);
});
test('ex5: concatenação altera a gramática; parâmetro não altera', t => {
  const db = banco(t);
  const resultado = comparar(db);
  assert.equal(resultado.concatenada.length, 4);
  assert.equal(resultado.parametrizada.length, 0);
  assert.equal(db.prepare('SELECT id FROM tarefas WHERE id = ?').get(1).id, 1);
});
test('ex6: commit grava conclusão e evento juntos', t => {
  const db = banco(t);
  criarHistorico(db);
  concluirComHistorico(db, { id: 1, usuarioId: 1 });
  assert.equal(db.prepare('SELECT concluida FROM tarefas WHERE id = 1').get().concluida, 1);
  assert.deepEqual(db.prepare('SELECT tarefa_id, evento FROM historico').all().map(r => ({ ...r })), [{ tarefa_id: 1, evento: 'CONCLUIDA' }]);
});
test('ex6: falha no INSERT reverte UPDATE; conexão aceita transação posterior', t => {
  const db = banco(t);
  criarHistorico(db);
  assert.throws(() => concluirComHistorico(db, { id: 1, usuarioId: 1, forcarErro: true }), /CHECK/);
  assert.equal(db.prepare('SELECT concluida FROM tarefas WHERE id = 1').get().concluida, 0);
  assert.equal(db.prepare('SELECT count(*) AS n FROM historico').get().n, 0);
  concluirComHistorico(db, { id: 1, usuarioId: 1 });
  assert.equal(db.prepare('SELECT count(*) AS n FROM historico').get().n, 1);
});
test('ex6: tarefa alheia ou ausente não gera histórico', t => {
  const db = banco(t);
  criarHistorico(db);
  for (const id of [3, 999]) assert.throws(() => concluirComHistorico(db, { id, usuarioId: 1 }), /indisponivel/);
  assert.equal(db.prepare('SELECT count(*) AS n FROM historico').get().n, 0);
  assert.equal(db.prepare('SELECT concluida FROM tarefas WHERE id = 3').get().concluida, 0);
});
test('ex6: repetir conclusão não duplica o histórico', t => {
  const db = banco(t);
  criarHistorico(db);
  concluirComHistorico(db, { id: 1, usuarioId: 1 });
  assert.throws(() => concluirComHistorico(db, { id: 1, usuarioId: 1 }), /indisponivel/);
  assert.equal(db.prepare('SELECT count(*) AS n FROM historico').get().n, 1);
});
test('histórico exige tarefa existente e remove dependentes por cascata', t => {
  const db = banco(t);
  criarHistorico(db);
  assert.throws(() => db.prepare('INSERT INTO historico (tarefa_id,evento) VALUES (?,?)').run(999, 'CONCLUIDA'), /FOREIGN KEY/);
  concluirComHistorico(db, { id: 1, usuarioId: 1 });
  db.prepare('DELETE FROM tarefas WHERE id = ?').run(1);
  assert.equal(db.prepare('SELECT count(*) AS n FROM historico').get().n, 0);
});
