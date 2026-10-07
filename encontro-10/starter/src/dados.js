// Dados inteiramente fictícios. A ordem inicial não está ordenada por título
// nem por data; títulos e datas repetidos permitem testar desempate por ID.
export function criarTarefas() {
  const titulos = [
    'Estudar HTTP', 'Revisar JavaScript', 'Testar a API',
    'Documentar endpoints', 'Praticar Express', 'Estudar paginação',
    'Revisar filtros', 'Testar a API', 'Organizar arquivos'
  ];

  return Array.from({ length: 27 }, (_, indice) => ({
    id: indice + 1,
    titulo: titulos[indice % titulos.length],
    concluida: indice % 3 === 0,
    usuarioId: (indice % 4) + 1,
    notaInterna: `Anotação fictícia de uso interno da tarefa ${indice + 1}`,
    criadoEm: new Date(Date.UTC(2026, 9, 1 + ((indice * 7) % 9), 12)).toISOString()
  }));
}
