export async function criarViewModel(tarefasService, modo) {
  return {
    tituloPagina: 'Minhas tarefas',
    explicacao: 'Os mesmos dados e a mesma estrutura visual, produzidos em lugares diferentes.',
    modo,
    tarefas: await tarefasService.listar()
  };
}
