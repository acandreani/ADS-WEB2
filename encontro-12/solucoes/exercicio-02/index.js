import { readFileSync } from 'node:fs';
import { demonstrar } from '../../lib/banco.js';
const sql = readFileSync(new URL('./consulta.sql', import.meta.url), 'utf8');

export function listarSegundaPagina(db, usuarioId, termo) {
  // % e _ conservam seu significado de curingas LIKE; os valores são vinculados.
  return db.prepare(sql).all(usuarioId, `%${termo}%`);
}
demonstrar(import.meta.url, db => console.table(listarSegundaPagina(db, 1, 'sql')), { extras: true });
