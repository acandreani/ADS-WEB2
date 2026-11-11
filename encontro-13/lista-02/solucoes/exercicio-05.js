import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { iniciar, requisitar } from '../lib/processo.js';
const pasta = mkdtempSync(join(tmpdir(), 'web2-reinicio-'));
let api;
try {
  const caminho = join(pasta, 'tarefas.db');
  api = await iniciar(caminho);
  const antes = await requisitar(api, 'POST', '/tarefas', { titulo: 'Sobrevive ao reinicio', prioridade: 'alta' });
  assert.equal(antes.status, 201);
  const pidAntes = api.pid;
  await api.parar(); api = undefined;
  api = await iniciar(caminho);
  const depois = await requisitar(api, 'GET', `/tarefas/${antes.body.id}`);
  assert.equal(depois.status, 200);
  assert.deepEqual(depois.body, antes.body);
  console.log(JSON.stringify({ banco: caminho, pidAntes, pidDepois: api.pid, antes, depois, resultado: 'Persistência comprovada' }, null, 2));
} finally { if (api) await api.parar(); rmSync(pasta, { recursive: true, force: true }); }
