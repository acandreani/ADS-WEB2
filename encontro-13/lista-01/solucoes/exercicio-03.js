import assert from 'node:assert/strict';
import { abrirBanco, inicializarBanco } from '../src/db.js';
import { criarTarefasSqlite } from '../src/repositories/sqlite.js';
import { criarUsuariosSqlite } from '../src/usuarios-repository.js';
import { respostaErro } from '../src/resposta-erro.js';

const db = abrirBanco(':memory:');
try {
  inicializarBanco(db);
  const tarefas = criarTarefasSqlite(db);
  const usuarios = criarUsuariosSqlite(db);
  const casos = [
    ['UNIQUE', () => usuarios.inserir({ nome: 'Outra Ada', email: 'ada@example.test' }), 409],
    ['CHECK', () => tarefas.inserir({ titulo: 'ab', concluida: false, usuarioId: 1 }), 400],
    ['FOREIGN KEY', () => tarefas.inserir({ titulo: 'Tarefa valida', concluida: false, usuarioId: 999 }), 400],
    ['SQL desconhecido', () => db.prepare('SELECT * FROM tabela_inexistente').all(), 500]
  ];
  for (const [nome, operacao, status] of casos) {
    let capturado;
    try { await operacao(); } catch (erro) { capturado = erro; }
    assert.ok(capturado, `${nome} deveria falhar`);
    const resposta = respostaErro(capturado, `demo-${status}`, log => {
      console.log('LOG INTERNO:', nome, log.erro.cause?.code ?? log.erro.code);
    });
    assert.equal(resposta.status, status);
    console.log('RESPOSTA PÚBLICA:', resposta);
  }
  assert.deepEqual(await tarefas.listarPorUsuario(1), []);
  console.log('OK: todas as falhas foram provocadas; nenhuma tarefa inválida foi gravada.');
} finally { db.close(); }
