import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';

export function abrirBanco(caminho) {
  const db = new Database(caminho);
  try {
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    return db;
  } catch (erro) {
    db.close();
    throw erro;
  }
}

export function inicializarBanco(db) {
  // Inicialização idempotente do exemplo, não um sistema de migrações.
  const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
  db.transaction(() => db.exec(schema))();
}
