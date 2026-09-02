import { Router } from 'express';

export function criarTarefasRouter(controller) {
  const router = Router();

  router.get('/', controller.listar);
  router.get('/:id', controller.obter);
  router.patch('/:id', controller.atualizar);

  return router;
}
