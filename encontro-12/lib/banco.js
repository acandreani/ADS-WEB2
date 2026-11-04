import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const raiz = fileURLToPath(new URL('../', import.meta.url));
export const lerSql = nome => readFileSync(new URL(`../sql/${nome}`, import.meta.url), 'utf8');

export function abrirBanco(caminho = ':memory:') {
  const db = new DatabaseSync(caminho);
  // Configuração da CONEXÃO, não apenas do arquivo de banco.
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}

export function preparar(db, { extras = false } = {}) {
  db.exec('BEGIN');
  try {
    db.exec(lerSql('schema.sql'));
    db.exec(lerSql('seed.sql'));
    if (extras) db.exec(lerSql('seed-exercicios.sql'));
    db.exec('COMMIT');
  } catch (erro) {
    db.exec('ROLLBACK');
    throw erro;
  }
}

export function bancoDescartavel(opcoes = {}) {
  const db = abrirBanco();
  try { preparar(db, opcoes); return db; }
  catch (erro) { db.close(); throw erro; }
}

export function demonstrar(url, acao, opcoes = {}) {
  if (!process.argv[1] || pathToFileURL(process.argv[1]).href !== url) return;
  const db = bancoDescartavel(opcoes);
  try { acao(db); } finally { db.close(); }
}
