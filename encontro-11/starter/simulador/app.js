import express from 'express';
import { setTimeout as esperar } from 'node:timers/promises';

export function criarSimulador({ modo = 'normal', atrasoMs = 2000 } = {}) {
  const modos = ['normal', 'lento', 'erro', 'invalido', 'estrutura', 'tipo'];
  if (!modos.includes(modo)) throw new Error(`Modo inválido. Use: ${modos.join(', ')}`);
  const app = express();
  let chamadas = 0;
  const categorias = [
    { codigo: 1, descricao: 'Papelaria' },
    { codigo: 2, descricao: 'Informática' }
  ];
  app.get('/metricas', (req, res) => res.json({ modo, chamadas }));
  app.get('/categorias/:id', async (req, res) => {
    chamadas++;
    if (modo === 'lento') await esperar(atrasoMs);
    if (modo === 'erro') return res.status(500).json({ mensagem: 'Falha simulada' });
    if (modo === 'invalido') return res.type('json').send('{"codigo":');
    if (modo === 'estrutura') return res.json({ codigo: 'abc', descricao: '' });
    if (modo === 'tipo') return res.type('html').send('<p>Resposta inesperada</p>');
    const categoria = categorias.find(item => item.codigo === Number(req.params.id));
    if (!categoria) return res.status(404).json({ mensagem: 'Categoria não encontrada' });
    return res.json(categoria);
  });
  return app;
}
