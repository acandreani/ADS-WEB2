import assert from 'node:assert/strict';
import { demonstrar } from '../../lib/banco.js';

export const casos = [
  ['PK usuarios', 'INSERT INTO usuarios (id,nome,email) VALUES (1,?,?)', ['Outra', 'outra@example.test'], /UNIQUE/],
  ['nome NOT NULL', 'INSERT INTO usuarios (nome,email) VALUES (?,?)', [null, 'nova@example.test'], /NOT NULL/],
  ['email NOT NULL', 'INSERT INTO usuarios (nome,email) VALUES (?,?)', ['Outra', null], /NOT NULL/],
  ['email UNIQUE', 'INSERT INTO usuarios (nome,email) VALUES (?,?)', ['Outra', 'ada@example.test'], /UNIQUE/],
  ['PK tarefas', 'INSERT INTO tarefas (id,titulo,usuario_id) VALUES (1,?,?)', ['Outra tarefa', 1], /UNIQUE/],
  ['titulo NOT NULL', 'INSERT INTO tarefas (titulo,usuario_id) VALUES (?,?)', [null, 1], /NOT NULL/],
  ['titulo vazio', 'INSERT INTO tarefas (titulo,usuario_id) VALUES (?,?)', ['', 1], /CHECK/],
  ['titulo so espacos', 'INSERT INTO tarefas (titulo,usuario_id) VALUES (?,?)', ['   ', 1], /CHECK/],
  ['titulo curto', 'INSERT INTO tarefas (titulo,usuario_id) VALUES (?,?)', ['ab', 1], /CHECK/],
  ['titulo longo', 'INSERT INTO tarefas (titulo,usuario_id) VALUES (?,?)', ['a'.repeat(121), 1], /CHECK/],
  ['concluida NOT NULL', 'INSERT INTO tarefas (titulo,usuario_id,concluida) VALUES (?,?,?)', ['Valida', 1, null], /NOT NULL/],
  ['concluida CHECK', 'INSERT INTO tarefas (titulo,usuario_id,concluida) VALUES (?,?,?)', ['Valida', 1, 2], /CHECK/],
  ['usuario_id NOT NULL', 'INSERT INTO tarefas (titulo,usuario_id) VALUES (?,?)', ['Valida', null], /NOT NULL/],
  ['usuario_id FK', 'INSERT INTO tarefas (titulo,usuario_id) VALUES (?,?)', ['Valida', 999], /FOREIGN KEY/],
  ['criado_em NOT NULL', 'INSERT INTO tarefas (titulo,usuario_id,criado_em) VALUES (?,?,?)', ['Valida', 1, null], /NOT NULL/]
];

export function verificarRestricoes(db) {
  assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
  return casos.map(([regra, sql, valores, erroEsperado]) => {
    assert.throws(() => db.prepare(sql).run(...valores), erroEsperado);
    return { regra, resultado: 'inserção rejeitada conforme esperado' };
  });
}
demonstrar(import.meta.url, db => console.table(verificarRestricoes(db)));
