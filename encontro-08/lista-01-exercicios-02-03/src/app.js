import express from 'express';
import { fileURLToPath } from 'node:url';

const pastaPublica = fileURLToPath(new URL('../public/', import.meta.url));

export function criarApp() {
  const app = express();
  const tarefas = [];
  let proximoId = 1;

  app.use(express.json());
  app.use(express.static(pastaPublica));

  const router = express.Router();

  router.get('/', (req, res) => res.json(tarefas));

  router.post('/', (req, res) => {
    const titulo = req.body?.titulo;
    if (typeof titulo !== 'string' ||
        titulo.trim().length < 3 || titulo.trim().length > 120) {
      return res.status(400).json({
        mensagem: 'O título deve ter entre 3 e 120 caracteres'
      });
    }

    const tarefa = {
      id: proximoId++,
      titulo: titulo.trim(),
      concluida: false
    };
    tarefas.push(tarefa);
    return res.status(201).location(`/tarefas/${tarefa.id}`).json(tarefa);
  });

  router.patch('/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ mensagem: 'ID inválido' });
    }
    if (typeof req.body?.concluida !== 'boolean') {
      return res.status(400).json({
        mensagem: 'O campo concluida deve ser booleano'
      });
    }
    const tarefa = tarefas.find((item) => item.id === id);
    if (!tarefa) {
      return res.status(404).json({ mensagem: 'Tarefa não encontrada' });
    }
    tarefa.concluida = req.body.concluida;
    return res.json(tarefa);
  });

  router.delete('/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ mensagem: 'ID inválido' });
    }
    const indice = tarefas.findIndex((item) => item.id === id);
    if (indice === -1) {
      return res.status(404).json({ mensagem: 'Tarefa não encontrada' });
    }
    tarefas.splice(indice, 1);
    return res.status(204).end();
  });

  // Texto 1: /tarefas. Proposta do starter: /api/tarefas.
  // As duas URLs utilizam o mesmo vetor e o mesmo contrato.
  app.use('/tarefas', router);
  app.use('/api/tarefas', router);

  app.use((req, res) => {
    return res.status(404).json({ mensagem: 'Rota não encontrada' });
  });

  app.use((erro, req, res, next) => {
    if (erro instanceof SyntaxError && 'body' in erro) {
      return res.status(400).json({ mensagem: 'JSON inválido' });
    }
    console.error(erro);
    return res.status(500).json({ mensagem: 'Erro interno' });
  });

  return app;
}
