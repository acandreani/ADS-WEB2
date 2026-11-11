import assert from 'node:assert/strict';
import { iniciar, requisitar } from '../lib/processo.js';
const api = await iniciar(':memory:');
try {
  const criada = await requisitar(api, 'POST', '/tarefas', { titulo: 'Estado inicial' });
  assert.equal(criada.status, 201);
  const rota = `/tarefas/${criada.body.id}`;
  const a = await requisitar(api, 'GET', rota);
  const b = await requisitar(api, 'GET', rota);
  console.log('Duas cópias leem a versão:', a.body.versao, b.body.versao);
  const resultados = await Promise.all([
    requisitar(api, 'PATCH', rota, { titulo: 'Edicao A', versao: a.body.versao }),
    requisitar(api, 'PATCH', rota, { titulo: 'Edicao B', versao: b.body.versao })
  ]);
  assert.deepEqual(resultados.map(r => r.status).sort(), [200, 409]);
  const vencedor = resultados.find(r => r.status === 200);
  const final = await requisitar(api, 'GET', rota);
  assert.equal(final.body.versao, 2);
  assert.deepEqual(final.body, vencedor.body);
  console.log(JSON.stringify({ resultados, estadoFinal: final }, null, 2));
} finally { await api.parar(); }
