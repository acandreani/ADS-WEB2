import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { abrirBanco, migrar, migracoes } from '../src/db.js';
import { criarSqlite } from '../src/repository.js';
import { iniciar, requisitar } from '../lib/processo.js';

for (const origem of ['novo', 'v1']) {
  test(`migração ${origem}: defaults, DTO, CRUD e reaplicação`, async t => {
    const db = abrirBanco(':memory:'); t.after(() => db.close());
    if (origem === 'v1') {
      migrar(db, migracoes.slice(0, 1));
      db.exec("INSERT INTO tarefas(titulo,usuario_id,criado_em) VALUES ('Antiga',1,'2026-01-01T00:00:00.000Z')");
    }
    assert.deepEqual(migrar(db), origem === 'novo' ? [1, 2, 3] : [2, 3]);
    const registros = db.prepare('SELECT * FROM schema_migrations').all();
    assert.deepEqual(migrar(db), []);
    assert.deepEqual(db.prepare('SELECT * FROM schema_migrations').all(), registros);
    const r = criarSqlite(db);
    if (origem === 'v1') {
      const antiga = await r.buscar(1, 1);
      assert.equal(antiga.prioridade, 'normal'); assert.equal(antiga.versao, 1);
      assert.equal(antiga.criadoEm, '2026-01-01T00:00:00.000Z');
    }
    const nova = await r.inserir({ titulo: 'Nova', usuarioId: 1, concluida: false, prioridade: 'alta' });
    assert.equal(nova.prioridade, 'alta'); assert.equal(nova.versao, 1);
    assert.equal(typeof nova.concluida, 'boolean');
    const alterada = await r.atualizar(nova.id, 1, 1, { concluida: true });
    assert.equal(alterada.prioridade, 'alta'); assert.equal(alterada.versao, 2);
    assert.equal(await r.buscar(999, 1), null);
    assert.equal(await r.remover(nova.id, 1, 2), true);
    assert.equal(await r.buscar(nova.id, 1), null);
  });
}
test('migração 002 impõe CHECK e NOT NULL', t => {
  const db = abrirBanco(':memory:'); t.after(() => db.close()); migrar(db);
  const stmt = db.prepare('INSERT INTO tarefas(titulo,usuario_id,criado_em,prioridade) VALUES (?,?,?,?)');
  assert.throws(() => stmt.run('Valida', 1, 'data', 'urgente'), { code: 'SQLITE_CONSTRAINT_CHECK' });
  assert.throws(() => stmt.run('Valida', 1, 'data', null), { code: 'SQLITE_CONSTRAINT_NOTNULL' });
});
test('migração com falha reverte DDL e registro de versão', t => {
  const db = abrirBanco(':memory:'); t.after(() => db.close());
  migrar(db, migracoes.slice(0, 1));
  assert.throws(() => migrar(db, [migracoes[0], { versao: 2, sql: 'ALTER TABLE tarefas ADD COLUMN teste TEXT; INSERT INTO inexistente VALUES (1);' }]));
  assert.equal(db.pragma('table_info(tarefas)').some(c => c.name === 'teste'), false);
  assert.deepEqual(db.prepare('SELECT versao FROM schema_migrations').all().map(r => r.versao), [1]);
  assert.deepEqual(migrar(db), [2, 3]);
});
test('versão desconhecida é recusada', t => {
  const db = abrirBanco(':memory:'); t.after(() => db.close()); migrar(db);
  db.exec('INSERT INTO schema_migrations(versao) VALUES (99)');
  assert.throws(() => migrar(db), /desconhecida/);
});
for (const armazenamento of ['sqlite', 'memoria']) {
  test(`HTTP ${armazenamento}: duas cópias, 200/409 e nenhuma perda silenciosa`, async () => {
    const api = await iniciar(':memory:', armazenamento);
    try {
      const criada = await requisitar(api, 'POST', '/tarefas', { titulo: 'Inicial' });
      assert.equal(criada.status, 201); assert.equal(criada.body.prioridade, 'normal');
      const rota = `/tarefas/${criada.body.id}`;
      const a = await requisitar(api, 'GET', rota), b = await requisitar(api, 'GET', rota);
      const resultados = await Promise.all([
        requisitar(api, 'PATCH', rota, { titulo: 'Titulo A', versao: a.body.versao }),
        requisitar(api, 'PATCH', rota, { titulo: 'Titulo B', versao: b.body.versao })
      ]);
      assert.deepEqual(resultados.map(r => r.status).sort(), [200, 409]);
      assert.deepEqual((await requisitar(api, 'GET', rota)).body, resultados.find(r => r.status === 200).body);
      assert.equal((await requisitar(api, 'PATCH', rota, { concluida: true, versao: 2 }, 2)).status, 409);
      assert.equal((await requisitar(api, 'GET', rota, undefined, 2)).status, 404);
      const proxima = await requisitar(api, 'PATCH', rota, { concluida: true, prioridade: 'baixa', versao: 2 });
      assert.equal(proxima.status, 200); assert.equal(proxima.body.versao, 3);
      assert.equal(proxima.body.concluida, true); assert.equal(proxima.body.prioridade, 'baixa');
      assert.equal((await requisitar(api, 'PATCH', rota, { concluida: false })).status, 400);
      assert.equal((await requisitar(api, 'PATCH', rota, { prioridade: 'urgente', versao: 3 })).status, 400);
      assert.equal((await requisitar(api, 'DELETE', rota + '?versao=2')).status, 409);
      assert.equal((await requisitar(api, 'DELETE', rota + '?versao=3')).status, 204);
      assert.equal((await requisitar(api, 'GET', rota)).status, 404);
    } finally { await api.parar(); }
  });
}
test('duas conexões SQLite ao mesmo arquivo rejeitam versão obsoleta', async () => {
  const pasta = mkdtempSync(join(tmpdir(), 'web2-concorrencia-'));
  const a = abrirBanco(join(pasta, 'teste.db')); migrar(a);
  const b = abrirBanco(join(pasta, 'teste.db')); migrar(b);
  try {
    const ra = criarSqlite(a), rb = criarSqlite(b);
    const t = await ra.inserir({ titulo: 'Inicial', usuarioId: 1, concluida: false, prioridade: 'normal' });
    const copia = await rb.buscar(t.id, 1);
    await ra.atualizar(t.id, 1, t.versao, { titulo: 'Vencedora' });
    await assert.rejects(rb.atualizar(t.id, 1, copia.versao, { titulo: 'Obsoleta' }), { status: 409 });
    assert.equal((await rb.buscar(t.id, 1)).titulo, 'Vencedora');
  } finally { a.close(); b.close(); rmSync(pasta, { recursive: true, force: true }); }
});
for (const caminhoEmMemoria of [false, true]) {
  test(`reinício HTTP: ${caminhoEmMemoria ? ':memory: perde dados (controle negativo)' : 'arquivo preserva ID, dados e status'}`, async () => {
    const pasta = mkdtempSync(join(tmpdir(), 'web2-persistencia-'));
    const caminho = caminhoEmMemoria ? ':memory:' : join(pasta, 'tarefas.db');
    let api;
    try {
      api = await iniciar(caminho);
      const antes = await requisitar(api, 'POST', '/tarefas', { titulo: 'Persistente', prioridade: 'alta' });
      assert.equal(antes.status, 201);
      const pid = api.pid;
      await api.parar(); api = undefined;
      api = await iniciar(caminho);
      assert.notEqual(api.pid, pid);
      const depois = await requisitar(api, 'GET', `/tarefas/${antes.body.id}`);
      assert.equal(depois.status, caminhoEmMemoria ? 404 : 200);
      if (!caminhoEmMemoria) assert.deepEqual(depois.body, antes.body);
    } finally { if (api) await api.parar(); rmSync(pasta, { recursive: true, force: true }); }
  });
}
