import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarAplicacao } from './app.js';
const caminho = process.env.DB_PATH ?? fileURLToPath(new URL('../dados/tarefas.db', import.meta.url));
if (caminho !== ':memory:') mkdirSync(dirname(resolve(caminho)), { recursive: true });
const app = criarAplicacao({ caminho, armazenamento: process.env.ARMAZENAMENTO ?? 'sqlite' });
const port = Number(process.env.PORT ?? 3013);
app.server.on('error', erro => { app.fechar(); console.error(erro); process.exitCode = 1; });
app.server.listen(port, '127.0.0.1', () => {
  const endereco = app.server.address();
  console.log(`API local: http://127.0.0.1:${endereco.port}`);
  if (process.send) process.send({ port: endereco.port });
});
let encerrando = false;
function encerrar() {
  if (encerrando) return;
  encerrando = true;
  app.server.close(() => { app.fechar(); process.exit(0); });
  app.server.closeIdleConnections();
}
process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
process.on('message', msg => { if (msg === 'encerrar') encerrar(); });
