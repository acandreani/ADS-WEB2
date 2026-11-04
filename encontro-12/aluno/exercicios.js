import { bancoDescartavel } from '../lib/banco.js';

const db = bancoDescartavel({ extras: true });
try {
  console.table(db.prepare('SELECT * FROM tarefas ORDER BY id').all());
  // Implemente aqui suas consultas com db.prepare(sql).all(...valores),
  // .get(...valores) e .run(...valores). Examine resultado.changes nas escritas.
  // Para transações, use db.exec('BEGIN'), COMMIT e ROLLBACK em try/catch.
  // Todo este banco desaparece ao encerrar o processo.
} finally {
  db.close();
}
