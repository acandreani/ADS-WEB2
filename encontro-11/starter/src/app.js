import express from 'express';
import { randomUUID } from 'node:crypto';

const produtos = [
  { id: 1, nome: 'Caderno', categoriaId: 1 },
  { id: 2, nome: 'Teclado', categoriaId: 2 },
  { id: 3, nome: 'Produto com categoria ausente', categoriaId: 999 }
];

export function criarApp({ categoriasClient, logger = console }) {
  const app = express();
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.set('X-Request-Id', req.requestId);
    next();
  });
  app.get('/api/produtos', (req, res) => res.json(produtos));
  app.get('/api/produtos/:id', async (req, res, next) => {
    const produto = produtos.find(item => item.id === Number(req.params.id));
    if (!produto) return res.status(404).json({ erro: {
      codigo: 'PRODUTO_NAO_ENCONTRADO', mensagem: 'Produto não encontrado.',
      requestId: req.requestId
    } });
    try {
      const categoria = await categoriasClient.obter(produto.categoriaId);
      // Lista 2: decidir fallback e eventual aviso segundo a regra de negócio.
      return res.json({ ...produto, categoria });
    } catch (erro) { next(erro); }
  });
  app.use((req, res) => res.status(404).json({ erro: {
    codigo: 'ROTA_NAO_ENCONTRADA', mensagem: 'Rota não encontrada.', requestId: req.requestId
  } }));
  app.use((erro, req, res, next) => {
    logger.error({ requestId: req.requestId, erro });
    // Exercício 3: o client deve fornecer erros 502/504 com causa interna.
    const status = [501, 502, 504].includes(erro.status) ? erro.status : 500;
    const pendente = status === 501;
    res.status(status).json({ erro: {
      codigo: pendente ? 'EXERCICIO_PENDENTE' : 'SERVICO_INDISPONIVEL',
      mensagem: pendente ? 'Implemente o client de categorias.' : 'Serviço temporariamente indisponível.',
      requestId: req.requestId
    } });
  });
  return app;
}
