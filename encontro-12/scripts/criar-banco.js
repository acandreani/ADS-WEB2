import { mkdirSync, openSync, closeSync } from 'node:fs';
import { join } from 'node:path';
import { raiz, abrirBanco, preparar } from '../lib/banco.js';

const args = process.argv.slice(2);
if (args.some(arg => arg !== '--extras')) throw new Error('Uso: npm run db:criar -- [--extras]');
const pasta = join(raiz, 'encontro12-sql');
mkdirSync(pasta, { recursive: true });
const caminho = join(pasta, 'tarefas.db');
// Reserva exclusiva: nunca sobrescrever silenciosamente um banco existente.
try { closeSync(openSync(caminho, 'wx')); }
catch (erro) {
  if (erro.code === 'EEXIST') throw new Error('O banco já existe. Renomeie-o como backup antes de criar outro.');
  throw erro;
}
const db = abrirBanco(caminho);
try {
  preparar(db, { extras: args.includes('--extras') });
  console.log('Banco criado:', caminho);
  console.table(db.prepare('SELECT * FROM usuarios').all());
  console.table(db.prepare('SELECT * FROM tarefas').all());
} finally { db.close(); }
