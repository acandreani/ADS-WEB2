import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarAplicacao } from './composicao.js';

const armazenamento = process.argv[2] ?? 'memoria';
const acao = process.argv[3] ?? 'demo';
if (!['demo', 'listar'].includes(acao)) throw new Error('Acao deve ser demo ou listar');
const caminho = process.env.DB_PATH
  ? resolve(process.env.DB_PATH)
  : fileURLToPath(new URL('../dados/tarefas.db', import.meta.url));
// Criar a pasta não cria conexão; o ciclo de vida do banco fica na composição.
mkdirSync(dirname(caminho), { recursive: true });
const app = criarAplicacao({ armazenamento, caminho });
try {
  console.log('Armazenamento:', armazenamento);
  console.log('Estado inicial de Ada:');
  console.table(await app.service.listar(1));
  if (acao === 'demo') {
    const criada = await app.service.criar(1, { titulo: 'Estudar repository SQLite' });
    console.log('Criada:', criada);
    console.log('Atualizada:', await app.service.atualizar(1, criada.id, { concluida: true }));
    try { await app.service.buscar(2, criada.id); }
    catch (erro) { if (erro.status !== 404) throw erro; console.log('Outro usuario recebe:', erro.codigo); }
    const temporaria = await app.service.criar(1, { titulo: 'Tarefa temporaria' });
    await app.service.remover(1, temporaria.id);
    console.log('Tarefa temporária removida. Estado final de Ada:');
    console.table(await app.service.listar(1));
  }
} finally {
  app.fechar();
}
