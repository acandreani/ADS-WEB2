import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { criarAplicacao } from '../src/composicao.js';
import { abrirBanco, inicializarBanco } from '../src/db.js';
import { criarTarefasRepository } from '../src/repositories/memoria.js';
import { criarTarefasSqlite, mapearTarefa } from '../src/repositories/sqlite.js';
import { traduzirErroSqlite } from '../src/erros.js';

const instante = '2026-11-11T12:00:00.000Z';
const agora = () => instante;
const dados = { titulo: 'Estudar SQLite', concluida: false, usuarioId: 1 };

function fixture(t, tipo) {
  if (tipo === 'memoria') return criarTarefasRepository({ agora });
  const db = abrirBanco(':memory:');
  inicializarBanco(db);
  t.after(() => db.close());
  return criarTarefasSqlite(db, { agora });
}

// Uma única especificação, executada contra AMBAS as implementações.
for (const tipo of ['memoria', 'sqlite']) {
  test(`${tipo}: ausência tem os mesmos retornos`, async t => {
    const r = fixture(t, tipo);
    assert.deepEqual(await r.listarPorUsuario(1), []);
    assert.equal(await r.buscarPorId(999), null);
    assert.equal(await r.atualizar(999, 1, { titulo: 'Outro titulo' }), null);
    assert.equal(await r.remover(999, 1), false);
  });
  test(`${tipo}: inserir devolve o modelo da aplicação, sem this`, async t => {
    const r = fixture(t, tipo);
    const { inserir } = r;
    assert.deepEqual(await inserir(dados), { id: 1, ...dados, criadoEm: instante });
    assert.equal(typeof (await r.buscarPorId(1)).concluida, 'boolean');
  });
  test(`${tipo}: listagem filtra proprietário e ordena por ID`, async t => {
    const r = fixture(t, tipo);
    const a = await r.inserir(dados);
    await r.inserir({ ...dados, usuarioId: 2 });
    const c = await r.inserir({ ...dados, titulo: 'Outra tarefa' });
    assert.deepEqual((await r.listarPorUsuario(1)).map(x => x.id), [a.id, c.id]);
  });
  test(`${tipo}: update parcial preserva dados e permite false`, async t => {
    const r = fixture(t, tipo);
    const a = await r.inserir(dados);
    assert.equal((await r.atualizar(a.id, 1, { concluida: true })).concluida, true);
    assert.deepEqual(await r.atualizar(a.id, 1, { concluida: false }), a);
    const b = await r.atualizar(a.id, 1, { titulo: 'Novo titulo' });
    assert.deepEqual(b, { ...a, titulo: 'Novo titulo' });
  });
  test(`${tipo}: escrita alheia não altera nem remove`, async t => {
    const r = fixture(t, tipo);
    const a = await r.inserir(dados);
    assert.equal(await r.atualizar(a.id, 2, { titulo: 'Nao permitido' }), null);
    assert.equal(await r.remover(a.id, 2), false);
    assert.deepEqual(await r.buscarPorId(a.id), a);
    assert.equal(await r.remover(a.id, 1), true);
    assert.equal(await r.remover(a.id, 1), false);
  });
  test(`${tipo}: alterar objeto retornado não altera armazenamento`, async t => {
    const r = fixture(t, tipo);
    const a = await r.inserir(dados);
    a.titulo = 'Mutacao externa';
    const lista = await r.listarPorUsuario(1);
    lista[0].concluida = true;
    assert.equal((await r.buscarPorId(a.id)).titulo, dados.titulo);
    assert.equal((await r.buscarPorId(a.id)).concluida, false);
  });
  test(`${tipo}: usuário inexistente tem erro conhecido`, async t => {
    const r = fixture(t, tipo);
    await assert.rejects(r.inserir({ ...dados, usuarioId: 999 }), { codigo: 'USUARIO_INEXISTENTE', status: 400 });
  });
  test(`${tipo}: valores com aparência de SQL continuam texto`, async t => {
    const r = fixture(t, tipo);
    const titulo = "Tarefa '); DROP TABLE tarefas; --";
    const criada = await r.inserir({ ...dados, titulo });
    assert.equal((await r.buscarPorId(criada.id)).titulo, titulo);
    assert.equal((await r.listarPorUsuario(1)).length, 1);
  });
  test(`${tipo}: o MESMO service faz CRUD e protege leitura`, async t => {
    const app = criarAplicacao({ armazenamento: tipo, agora });
    t.after(() => app.fechar());
    const s = app.service;
    const a = await s.criar(1, { titulo: '  Tarefa normalizada  ' });
    assert.equal(a.titulo, 'Tarefa normalizada');
    assert.equal(a.concluida, false);
    assert.deepEqual(await s.buscar(1, a.id), a);
    await assert.rejects(s.buscar(2, a.id), { codigo: 'TAREFA_NAO_ENCONTRADA', status: 404 });
    await assert.rejects(s.buscar(2, 999), { codigo: 'TAREFA_NAO_ENCONTRADA', status: 404 });
    await assert.rejects(s.atualizar(2, a.id, { concluida: true }), { status: 404 });
    await assert.rejects(s.remover(2, a.id), { status: 404 });
    assert.equal((await s.atualizar(1, a.id, { concluida: true })).concluida, true);
    assert.equal(await s.remover(1, a.id), true);
    assert.deepEqual(await s.listar(1), []);
  });
  test(`${tipo}: validação é igual antes de chamar a infraestrutura`, async t => {
    const app = criarAplicacao({ armazenamento: tipo, agora });
    t.after(() => app.fechar());
    const s = app.service;
    for (const entrada of [{ titulo: 'ab' }, { titulo: 'a'.repeat(121) }, { titulo: 'Valida', concluida: 1 }, { titulo: 'Valida', usuarioId: 2 }, null]) {
      await assert.rejects(s.criar(1, entrada), { status: 400 });
    }
    const a = await s.criar(1, { titulo: 'Tarefa valida' });
    await assert.rejects(s.atualizar(1, a.id, {}), { status: 400 });
    await assert.rejects(s.atualizar(1, a.id, { usuarioId: 2 }), { status: 400 });
    await assert.rejects(s.listar('1'), { status: 400 });
  });
}

test('SQLite: mapper converte null, nomes SQL e booleano', () => {
  assert.equal(mapearTarefa(undefined), null);
  assert.deepEqual(mapearTarefa({ id: 7, titulo: 'Teste', concluida: 1, usuario_id: 2, criado_em: instante }),
    { id: 7, titulo: 'Teste', concluida: true, usuarioId: 2, criadoEm: instante });
});
test('SQLite: CHECK traduzido; falhas desconhecidas permanecem originais', async t => {
  const r = fixture(t, 'sqlite');
  await assert.rejects(r.inserir({ ...dados, titulo: 'a' }), e => e.status === 400 && e.cause.code === 'SQLITE_CONSTRAINT_CHECK');
  const erro = Object.assign(new Error('Falha de disco'), { code: 'SQLITE_IOERR' });
  assert.equal(traduzirErroSqlite(erro), erro);
  const db = abrirBanco(':memory:');
  inicializarBanco(db);
  const fechado = criarTarefasSqlite(db);
  db.close();
  await assert.rejects(fechado.inserir(dados), e => e.status === undefined);
});
test('SQLite: persiste entre processos, usa WAL/FK e não perde dados ao reinicializar', t => {
  const pasta = mkdtempSync(join(tmpdir(), 'web2-repository-'));
  const caminho = join(pasta, 'tarefas.db');
  t.after(() => rmSync(pasta, { recursive: true, force: true }));
  const modulo = new URL('../src/composicao.js', import.meta.url).href;
  const executar = codigo => execFileSync(process.execPath, ['--input-type=module', '-e',
    `import { criarAplicacao } from ${JSON.stringify(modulo)};
     const app = criarAplicacao({armazenamento:'sqlite', caminho:process.argv[1]});
     try { ${codigo} } finally { app.fechar(); }`, caminho], { encoding: 'utf8' });
  const criada = JSON.parse(executar(`console.log(JSON.stringify(await app.service.criar(1,{titulo:'Sobrevive ao processo'})));`));
  const recuperada = JSON.parse(executar(`console.log(JSON.stringify(await app.service.buscar(1,${criada.id})));`));
  assert.deepEqual(recuperada, criada);
  const db = abrirBanco(caminho);
  try {
    assert.equal(db.pragma('foreign_keys', { simple: true }), 1);
    assert.equal(db.pragma('journal_mode', { simple: true }), 'wal');
    assert.equal(db.prepare('SELECT concluida FROM tarefas').get().concluida, 0);
  } finally { db.close(); }
});
