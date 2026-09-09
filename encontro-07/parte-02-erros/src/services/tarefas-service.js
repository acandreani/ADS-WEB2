import { AppError } from '../errors/app-error.js';
import {
  lerId,
  validarCriacaoTarefa
} from '../validators/tarefas-validator.js';

export function criarTarefasService(repository) {
  return {
    async criar(entrada) {
      const dados = validarCriacaoTarefa(entrada);
      const duplicada = await repository.buscarAtivaPorTitulo(
        dados.titulo
      );

      if (duplicada) {
        throw new AppError(
          'TITULO_DUPLICADO',
          'Já existe uma tarefa ativa com esse título',
          409
        );
      }

      return repository.inserir(dados);
    },

    async obter(idEmTexto) {
      const id = lerId(idEmTexto);
      const tarefa = await repository.buscarPorId(id);

      if (!tarefa) {
        throw new AppError(
          'TAREFA_NAO_ENCONTRADA',
          'Tarefa não encontrada',
          404
        );
      }

      return tarefa;
    }
  };
}
