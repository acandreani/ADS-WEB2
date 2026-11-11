import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';

export const migracoes = ['001_inicial.sql', '002_prioridade.sql', '003_versao.sql']
  .map((nome, i) => ({ versao: i + 1, sql: readFileSync(new URL(`../migrations/${nome}`, import.meta.url), 'utf8') }));
export function abrirBanco(caminho) {
  const db = new Database(caminho);
  try { db.pragma('foreign_keys=ON'); db.pragma('journal_mode=WAL'); return db; }
  catch (erro) { db.close(); throw erro; }
}
export function migrar(db, etapas = migracoes) {
  // Uma transação IMMEDIATE impede dois aplicadores de decidir sobre a mesma versão.
  // DDL e registro de sucesso são confirmados juntos; falha reverte todo este lote.
  return db.transaction(() => {
    db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
      versao INTEGER PRIMARY KEY, aplicada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
    const aplicadas = db.prepare('SELECT versao FROM schema_migrations ORDER BY versao').all().map(r => r.versao);
    const previstas = etapas.map(m => m.versao);
    if (previstas.some((v, i) => v !== i + 1) || aplicadas.some((v, i) => v !== previstas[i])) {
      throw new Error('Versao de esquema desconhecida ou historico de migracoes inconsistente');
    }
    const novas = [];
    for (const etapa of etapas.slice(aplicadas.length)) {
      db.exec(etapa.sql);
      db.prepare('INSERT INTO schema_migrations(versao) VALUES (?)').run(etapa.versao);
      novas.push(etapa.versao);
    }
    return novas;
  }).immediate();
}
