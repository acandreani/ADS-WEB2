import { criarApp } from './app.js';
import { criarCategoriasClient } from './clients/categorias-client.js';

const categoriasClient = criarCategoriasClient({
  baseUrl: process.env.CATEGORIAS_URL ?? 'http://localhost:4000',
  timeoutMs: Number(process.env.CATEGORIAS_TIMEOUT_MS ?? 300)
});
criarApp({ categoriasClient }).listen(Number(process.env.PORTA ?? 3000), () => {
  console.log('Catálogo iniciado. Consulte /api/produtos na porta configurada (padrão 3000).');
});
