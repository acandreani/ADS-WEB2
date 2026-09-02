import { ErroValidacao } from '../errors/erro-validacao.js';

function lerId(valor) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function criarTarefasController(service) {
  return {
    async listar(req, res) {
      const tarefas = await service.listar();
      return res.status(200).json(tarefas);
    },

    async obter(req, res) {
      const id = lerId(req.params.id);

      if (id === null) {
        return res.status(400).json({
          erro: 'O ID deve ser um inteiro positivo'
        });
      }

      const tarefa = await service.obter(id);

      if (!tarefa) {
        return res.status(404).json({
          erro: 'Tarefa não encontrada'
        });
      }

      return res.status(200).json(tarefa);
    },

    async atualizar(req, res) {
      const id = lerId(req.params.id);

      if (id === null) {
        return res.status(400).json({
          erro: 'O ID deve ser um inteiro positivo'
        });
      }

      try {
        const tarefa = await service.atualizar(id, req.body);

        if (!tarefa) {
          return res.status(404).json({
            erro: 'Tarefa não encontrada'
          });
        }

        return res.status(200).json(tarefa);
      } catch (erro) {
        if (erro instanceof ErroValidacao) {
          return res.status(400).json({
            erro: erro.message
          });
        }

        throw erro;
      }
    }
  };
}
