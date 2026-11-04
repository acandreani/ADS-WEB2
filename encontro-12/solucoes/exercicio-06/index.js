import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { demonstrar } from '../../lib/banco.js';
export const criarHistorico = db => db.exec(readFileSync(new URL('./historico.sql', import.meta.url), 'utf8'));

export function concluirComHistorico(db, { id, usuarioId, forcarErro = false }) {
  // forcarErro é exclusivamente uma ferramenta do laboratório, não parâmetro de uma API.
  db.exec('BEGIN');
  try {
    const { changes } = db.prepare(`UPDATE tarefas SET concluida = 1
      WHERE id = ? AND usuario_id = ? AND concluida = 0`).run(id, usuarioId);
    if (changes !== 1) throw new Error('Tarefa indisponivel para conclusao');
    db.prepare('INSERT INTO historico (tarefa_id, evento) VALUES (?, ?)')
      .run(id, forcarErro ? 'EVENTO_INVALIDO' : 'CONCLUIDA');
    db.exec('COMMIT');
  } catch (erro) {
    // A falha de CHECK aborta a instrução, mas não reverte sozinha o UPDATE anterior.
    db.exec('ROLLBACK');
    throw erro;
  }
}

demonstrar(import.meta.url, db => {
  criarHistorico(db);
  const estado = () => ({
    tarefa: db.prepare('SELECT id, concluida FROM tarefas WHERE id = 1').get(),
    historico: db.prepare('SELECT * FROM historico').all()
  });
  console.log('Antes:', estado());
  assert.throws(() => concluirComHistorico(db, { id: 1, usuarioId: 1, forcarErro: true }), /CHECK/);
  console.log('Depois da falha e do ROLLBACK:', estado());
  assert.equal(estado().tarefa.concluida, 0);
  assert.equal(estado().historico.length, 0);
  concluirComHistorico(db, { id: 1, usuarioId: 1 });
  console.log('Depois do COMMIT:', estado());
});
