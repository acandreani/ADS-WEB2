import { readFileSync } from 'node:fs';
import { demonstrar } from '../../lib/banco.js';
const sql = readFileSync(new URL('./consulta.sql', import.meta.url), 'utf8');

export function atualizarTitulo(db, { id, usuarioId, titulo }) {
  // usuarioId deve vir da autenticação em uma API, não de um campo livre do cliente.
  const { changes } = db.prepare(sql).run(titulo, id, usuarioId);
  return changes === 0
    ? { status: 404, mensagem: 'Tarefa nao encontrada' }
    : { status: 200, mensagem: 'Tarefa atualizada' };
}
demonstrar(import.meta.url, db => {
  console.log('Antes:', db.prepare('SELECT * FROM tarefas WHERE id = 1').get());
  console.log('Outro usuário:', atualizarTitulo(db, { id: 1, usuarioId: 2, titulo: 'Titulo proibido' }));
  console.log('ID ausente:', atualizarTitulo(db, { id: 999, usuarioId: 1, titulo: 'Titulo ausente' }));
  console.log('Proprietário:', atualizarTitulo(db, { id: 1, usuarioId: 1, titulo: 'Revisar SQLite' }));
  console.log('Depois:', db.prepare('SELECT * FROM tarefas WHERE id = 1').get());
});
