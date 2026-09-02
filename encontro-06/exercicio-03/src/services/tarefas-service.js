import { ErroValidacao } from '../errors/erro-validacao.js';

export function criarTarefasService(repository) {
  return {
    async listar() {
      return repository.listar();
    },

    async obter(id) {
      return repository.buscarPorId(id);
    },

    async atualizar(id, entrada) {
      if (
        entrada === null ||
        typeof entrada !== 'object' ||
        Array.isArray(entrada)
      ) {
        throw new ErroValidacao('O corpo deve ser um objeto JSON');
      }

      // Somente campos permitidos seguem para o repository.
      const alteracoes = {};

      if (Object.hasOwn(entrada, 'titulo')) {
        if (
          typeof entrada.titulo !== 'string' ||
          entrada.titulo.trim() === ''
        ) {
          throw new ErroValidacao(
            'O título deve ser um texto não vazio'
          );
        }

        alteracoes.titulo = entrada.titulo.trim();
      }

      if (Object.hasOwn(entrada, 'concluida')) {
        if (typeof entrada.concluida !== 'boolean') {
          throw new ErroValidacao(
            'O campo concluida deve ser booleano'
          );
        }

        alteracoes.concluida = entrada.concluida;
      }

      if (Object.keys(alteracoes).length === 0) {
        throw new ErroValidacao(
          'Informe titulo ou concluida para atualizar'
        );
      }

      const existente = await repository.buscarPorId(id);

      if (!existente) {
        return null;
      }

      return repository.atualizar(id, alteracoes);
    }
  };
}
