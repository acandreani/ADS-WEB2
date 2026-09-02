import express from 'express';

import { criarTarefasController }
  from './controllers/tarefas-controller.js';
import { criarTarefasRepository }
  from './repositories/tarefas-memory.js';
import { criarTarefasRouter }
  from './routes/tarefas-router.js';
import { criarTarefasService }
  from './services/tarefas-service.js';

export const app = express();

app.use(express.json());

// Ponto de composição das dependências.
const repository = criarTarefasRepository();
const service = criarTarefasService(repository);
const controller = criarTarefasController(service);
const router = criarTarefasRouter(controller);

app.use('/tarefas', router);

app.use((req, res) => {
  return res.status(404).json({
    erro: 'Rota não encontrada'
  });
});

app.use((erro, req, res, next) => {
  console.error(erro);

  return res.status(500).json({
    erro: 'Erro interno do servidor'
  });
});
