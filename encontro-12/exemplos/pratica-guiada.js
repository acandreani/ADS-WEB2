import { demonstrar } from '../lib/banco.js';

demonstrar(import.meta.url, db => {
  console.log('Banco descartável em memória: dois usuários e quatro tarefas.');
  console.table(db.prepare('SELECT * FROM tarefas ORDER BY id').all());
  console.log('Pendentes de Ada:');
  console.table(db.prepare('SELECT * FROM tarefas WHERE usuario_id = ? AND concluida = 0').all(1));
  const atualizacao = db.prepare('UPDATE tarefas SET titulo = ? WHERE id = ? AND usuario_id = ?')
    .run('Estudar SQL com parametros', 1, 1);
  console.log('Linhas atualizadas:', atualizacao.changes);
  const remocao = db.prepare('DELETE FROM tarefas WHERE id = ? AND usuario_id = ?').run(4, 2);
  console.log('Linhas removidas:', remocao.changes);
  console.table(db.prepare('SELECT * FROM tarefas ORDER BY id').all());
});
