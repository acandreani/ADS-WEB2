export function criarTarefasController(service) {
  return {
    async criar(req, res) {
      const tarefa = await service.criar(req.body);

      return res
        .status(201)
        .location(`/tarefas/${tarefa.id}`)
        .json(tarefa);
    },

    async obter(req, res) {
      const tarefa = await service.obter(req.params.id);
      return res.status(200).json(tarefa);
    }
  };
}
