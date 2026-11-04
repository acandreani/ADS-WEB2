import { readFileSync } from 'node:fs';
import { demonstrar } from '../../lib/banco.js';
const sql = readFileSync(new URL('./consulta.sql', import.meta.url), 'utf8');
export const resumirUsuarios = db => db.prepare(sql).all();
demonstrar(import.meta.url, db => console.table(resumirUsuarios(db)), { extras: true });
