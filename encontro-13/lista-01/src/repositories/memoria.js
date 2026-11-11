import { ErroAplicacao } from '../erros.js';

export function criarTarefasRepository({ agora = () => new Date().toISOString() } = {}) {
  const tarefas = new Map();
  const usuarios = new Set([1, 2]);
  let proximoId = 1;
  const copiar = tarefa => tarefa ? { ...tarefa } : null;
  return {
    async listarPorUsuario(usuarioId) {
      return [...tarefas.values()].filter(t => t.usuarioId === usuarioId)
        .sort((a, b) => a.id - b.id).map(copiar);
    },
    async buscarPorId(id) { return copiar(tarefas.get(id)); },
    async inserir({ titulo, concluida, usuarioId }) {
      if (!usuarios.has(usuarioId)) throw new ErroAplicacao('USUARIO_INEXISTENTE', 'Usuario inexistente', 400);
      const tarefa = { id: proximoId++, titulo, concluida, usuarioId, criadoEm: agora() };
      tarefas.set(tarefa.id, tarefa);
      return copiar(tarefa);
    },
    async atualizar(id, usuarioId, alteracoes) {
      const tarefa = tarefas.get(id);
      if (!tarefa || tarefa.usuarioId !== usuarioId) return null;
      if (Object.hasOwn(alteracoes, 'titulo')) tarefa.titulo = alteracoes.titulo;
      if (Object.hasOwn(alteracoes, 'concluida')) tarefa.concluida = alteracoes.concluida;
      return copiar(tarefa);
    },
    async remover(id, usuarioId) {
      const tarefa = tarefas.get(id);
      if (!tarefa || tarefa.usuarioId !== usuarioId) return false;
      return tarefas.delete(id);
    }
  };
}
