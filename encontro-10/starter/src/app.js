import express from 'express';
import { criarTarefas } from './dados.js';

export function criarApp() {
  const app = express();
  const tarefas = criarTarefas();

  // Ponto de partida, ainda sem versão. O aluno definirá /api/v1.
  app.get('/tarefas', (req, res) => {
    // TODO: validar parâmetros; filtrar; ordenar; paginar; aplicar DTO.
    // Inicialmente os parâmetros da URL são ignorados e todos os campos
    // fictícios saem na resposta, para permitir a atividade sobre vazamento.
    return res.json(tarefas);
  });

  app.get('/tarefas/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        erro: { codigo: 'ID_INVALIDO', mensagem: 'O ID deve ser um inteiro positivo.' }
      });
    }

    const tarefa = tarefas.find((item) => item.id === id);
    if (!tarefa) {
      return res.status(404).json({
        erro: { codigo: 'TAREFA_NAO_ENCONTRADA', mensagem: 'Tarefa não encontrada.' }
      });
    }
    // TODO: aplicar também aqui o DTO que controla os campos públicos.
    return res.json(tarefa);
  });

  app.use((req, res) => res.status(404).json({
    erro: { codigo: 'ROTA_NAO_ENCONTRADA', mensagem: 'Rota não encontrada.' }
  }));

  return app;
}
