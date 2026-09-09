import { Router } from 'express';

export function criarTarefasRouter(controller) {
  const router = Router();

  router.post('/', controller.criar);
  router.get('/:id', controller.obter);

  return router;
}
