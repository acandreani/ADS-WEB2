const tarefas = [
  { id: 1, titulo: 'Ler o código da rota', concluida: true },
  { id: 2, titulo: 'Comparar o código-fonte recebido', concluida: false },
  { id: 3, titulo: 'Observar as requisições no Network', concluida: false },
  { id: 4, titulo: '<script>alert("isto deve ser texto")</script>', concluida: false }
];

export const tarefasService = {
  async listar() {
    // Retorna cópias para a camada de apresentação não alterar o estado.
    return tarefas.map((tarefa) => ({ ...tarefa }));
  }
};
