import test from 'node:test';
import assert from 'node:assert/strict';
import { abrirBanco, inicializarBanco } from '../src/db.js';
import { criarTarefasSqlite } from '../src/repositories/sqlite.js';
import { criarUsuariosSqlite } from '../src/usuarios-repository.js';
import { respostaErro } from '../src/resposta-erro.js';

function contexto(t) {
  const db = abrirBanco(':memory:');
  inicializarBanco(db);
  t.after(() => { if (db.open) db.close(); });
  return { db, tarefas: criarTarefasSqlite(db), usuarios: criarUsuariosSqlite(db) };
}
for (const [nome, acao, codigo, status, causa] of [
  ['UNIQUE', c => c.usuarios.inserir({ nome: 'Duplicada', email: 'ada@example.test' }), 'EMAIL_JA_CADASTRADO', 409, 'SQLITE_CONSTRAINT_UNIQUE'],
  ['CHECK', c => c.tarefas.inserir({ titulo: 'ab', concluida: false, usuarioId: 1 }), 'DADOS_INVALIDOS', 400, 'SQLITE_CONSTRAINT_CHECK'],
  ['FOREIGN KEY', c => c.tarefas.inserir({ titulo: 'Valida', concluida: false, usuarioId: 999 }), 'USUARIO_INEXISTENTE', 400, 'SQLITE_CONSTRAINT_FOREIGNKEY']
]) {
  test(`${nome}: erro real traduzido, causa privada e resposta controlada`, async t => {
    const c = contexto(t);
    await assert.rejects(acao(c), erro => {
      assert.equal(erro.codigo, codigo);
      assert.equal(erro.cause.code, causa);
      const logs = [];
      const resposta = respostaErro(erro, 'teste-1', log => logs.push(log));
      assert.equal(resposta.status, status);
      assert.equal(resposta.body.codigo, codigo);
      assert.equal(resposta.body.requestId, 'teste-1');
      assert.equal(logs[0].erro, erro);
      assert.equal(JSON.stringify(resposta).includes('SQLITE'), false);
      assert.equal(Object.hasOwn(resposta.body, 'cause'), false);
      return true;
    });
    assert.equal(c.db.prepare('SELECT count(*) AS n FROM tarefas').get().n, 0);
    assert.equal(c.db.prepare('SELECT count(*) AS n FROM usuarios').get().n, 2);
  });
}
test('erro SQL real desconhecido chega à borda como 500 sem SQL nem stack', t => {
  const { db } = contexto(t);
  assert.throws(() => db.prepare('SELECT * FROM segredo_interno'), erro => {
    const resposta = respostaErro(erro, 'r2', () => {});
    assert.equal(resposta.status, 500);
    assert.equal(JSON.stringify(resposta).includes('segredo_interno'), false);
    assert.equal(Object.hasOwn(resposta.body, 'stack'), false);
    return true;
  });
});
test('falha inesperada dentro do repository não é convertida em 400', async t => {
  const { db, tarefas } = contexto(t);
  db.close();
  await assert.rejects(tarefas.inserir({ titulo: 'Valida', concluida: false, usuarioId: 1 }), erro => {
    assert.equal(respostaErro(erro, 'r3', () => {}).status, 500);
    return true;
  });
});
test('inserção válida de usuário funciona após um conflito', async t => {
  const { usuarios } = contexto(t);
  await assert.rejects(usuarios.inserir({ nome: 'Duplicada', email: 'ada@example.test' }), { status: 409 });
  const usuario = await usuarios.inserir({ nome: 'Carla', email: 'carla@example.test' });
  assert.equal(usuario.nome, 'Carla');
  assert.equal(usuario.email, 'carla@example.test');
});
