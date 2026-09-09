import express from 'express';

import { criarTarefasController }
  from './controllers/tarefas-controller.js';
import { adicionarRequestId }
  from './middlewares/request-id.js';
import { rotaNaoEncontrada }
  from './middlewares/rota-nao-encontrada.js';
import { criarTratadorDeErros }
  from './middlewares/tratador-erros.js';
import { criarTarefasRepository }
  from './repositories/tarefas-memory.js';
import { criarTarefasRouter }
  from './routes/tarefas-router.js';
import { criarTarefasService }
  from './services/tarefas-service.js';

export function criarApp({
  habilitarRotaDebug = false,
  logger = console
} = {}) {
  const app = express();

  app.use(adicionarRequestId);
  app.use(express.json());

  const repository = criarTarefasRepository();
  const service = criarTarefasService(repository);
  const controller = criarTarefasController(service);
  const router = criarTarefasRouter(controller);

  app.get('/saude', (req, res) => {
    return res.status(200).json({
      status: 'ok',
      requestId: req.requestId
    });
  });

  app.use('/tarefas', router);

  // Usada somente para demonstrar que detalhes internos não vazam.
  if (habilitarRotaDebug) {
    app.get('/debug/erro', () => {
      throw new Error('senha-db=segredo');
    });
  }

  // O 404 fica depois de todas as rotas válidas.
  app.use(rotaNaoEncontrada);

  // O middleware de erro possui quatro parâmetros e fica por último.
  app.use(criarTratadorDeErros(logger));

  return app;
}

export const app = criarApp({
  habilitarRotaDebug: process.env.HABILITAR_ROTA_DEBUG === 'true'
});
