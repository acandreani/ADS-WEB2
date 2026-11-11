import { ErroAplicacao } from './erros.js';
import { validarId, validarCampos } from './validacao.js';

// Nenhum import de SQLite, SQL ou if sobre o armazenamento nesta camada.
export function criarTarefasService(repository) {
  const naoEncontrada = () => new ErroAplicacao('TAREFA_NAO_ENCONTRADA', 'Tarefa nao encontrada', 404);
  return {
    async listar(usuarioId) {
      validarId(usuarioId);
      return repository.listarPorUsuario(usuarioId);
    },
    async buscar(usuarioId, id) {
      validarId(usuarioId); validarId(id);
      const tarefa = await repository.buscarPorId(id);
      if (!tarefa || tarefa.usuarioId !== usuarioId) throw naoEncontrada();
      return tarefa;
    },
    async criar(usuarioId, dados) {
      validarId(usuarioId);
      return repository.inserir({ ...validarCampos(dados), usuarioId });
    },
    async atualizar(usuarioId, id, dados) {
      validarId(usuarioId); validarId(id);
      const alteracoes = validarCampos(dados, { parcial: true });
      // Propriedade verificada na própria escrita, não com buscar + gravar.
      const tarefa = await repository.atualizar(id, usuarioId, alteracoes);
      if (!tarefa) throw naoEncontrada();
      return tarefa;
    },
    async remover(usuarioId, id) {
      validarId(usuarioId); validarId(id);
      if (!await repository.remover(id, usuarioId)) throw naoEncontrada();
      return true;
    }
  };
}
