export function criarTarefasRepository() {
  const itens = [
    {
      id: 1,
      titulo: 'Estudar arquitetura',
      concluida: false
    },
    {
      id: 2,
      titulo: 'Implementar repository',
      concluida: true
    },
    {
      id: 3,
      titulo: 'Revisar dependências',
      concluida: false
    }
  ];

  return {
    async listar() {
      return itens.map((item) => ({ ...item }));
    },

    async buscarPorId(id) {
      const item = itens.find((tarefa) => tarefa.id === id);
      return item ? { ...item } : null;
    },

    async atualizar(id, alteracoes) {
      const indice = itens.findIndex((item) => item.id === id);

      if (indice === -1) {
        return null;
      }

      itens[indice] = {
        ...itens[indice],
        ...alteracoes,
        id
      };

      return { ...itens[indice] };
    }
  };
}
