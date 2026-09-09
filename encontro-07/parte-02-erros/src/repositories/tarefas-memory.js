export function criarTarefasRepository() {
  const tarefas = [];
  let proximoId = 1;

  return {
    async inserir(dados) {
      const tarefa = {
        id: proximoId++,
        ...dados
      };

      tarefas.push(tarefa);
      return { ...tarefa };
    },

    async buscarPorId(id) {
      const tarefa = tarefas.find((item) => item.id === id);
      return tarefa ? { ...tarefa } : null;
    },

    async buscarAtivaPorTitulo(titulo) {
      const tituloNormalizado = titulo.toLocaleLowerCase('pt-BR');

      const tarefa = tarefas.find((item) => (
        !item.concluida &&
        item.titulo.toLocaleLowerCase('pt-BR') === tituloNormalizado
      ));

      return tarefa ? { ...tarefa } : null;
    }
  };
}
