import { abrirBanco, inicializarBanco } from './db.js';
import { criarTarefasRepository } from './repositories/memoria.js';
import { criarTarefasSqlite } from './repositories/sqlite.js';
import { criarTarefasService } from './service.js';

export function criarAplicacao({ armazenamento = 'memoria', caminho = ':memory:', agora } = {}) {
  let db;
  let repository;
  // Este é o único ponto da aplicação que escolhe a implementação.
  if (armazenamento === 'memoria') repository = criarTarefasRepository({ agora });
  else if (armazenamento === 'sqlite') {
    db = abrirBanco(caminho);
    try {
      inicializarBanco(db);
      repository = criarTarefasSqlite(db, { agora });
    } catch (erro) { db.close(); throw erro; }
  } else throw new Error('Armazenamento deve ser memoria ou sqlite');
  return {
    service: criarTarefasService(repository),
    fechar() { if (db?.open) db.close(); }
  };
}
