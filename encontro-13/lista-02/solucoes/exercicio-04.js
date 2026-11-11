import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { abrirBanco, migrar, migracoes } from '../src/db.js';
import { criarSqlite } from '../src/repository.js';
const pasta = mkdtempSync(join(tmpdir(), 'web2-migracoes-'));
try {
  for (const tipo of ['novo', 'v1']) {
    const caminho = join(pasta, `${tipo}.db`);
    let db = abrirBanco(caminho);
    try {
      if (tipo === 'v1') {
        migrar(db, migracoes.slice(0, 1));
        db.prepare('INSERT INTO tarefas(titulo,usuario_id,criado_em) VALUES (?,?,?)')
          .run('Tarefa anterior', 1, '2026-01-01T00:00:00.000Z');
      }
    } finally { db.close(); }
    db = abrirBanco(caminho);
    try {
      console.log(tipo, 'migrações aplicadas:', migrar(db));
      assert.deepEqual(migrar(db), []);
      const repo = criarSqlite(db);
      if (tipo === 'v1') {
        const antiga = await repo.buscar(1, 1);
        assert.equal(antiga.titulo, 'Tarefa anterior');
        assert.equal(antiga.prioridade, 'normal');
        assert.equal(antiga.versao, 1);
        console.log('DTO antigo migrado:', antiga);
      }
      console.log('DTO novo:', await repo.inserir({ titulo: 'Nova tarefa', usuarioId: 1, concluida: false, prioridade: 'alta' }));
      console.table(db.prepare('SELECT * FROM schema_migrations').all());
    } finally { db.close(); }
  }
} finally { rmSync(pasta, { recursive: true, force: true }); }
