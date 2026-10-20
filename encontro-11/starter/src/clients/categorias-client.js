// Exercícios 2 e 3: implementar a fronteira HTTP aqui.
// Contrato interno: obter(id) -> { id, nome } ou null para 404.
// Nenhum controller/service deve conhecer os campos codigo e descricao.
export function criarCategoriasClient({ baseUrl, timeoutMs }) {
  return {
    async obter(id) {
      // TODO: fetch, status, Content-Type, JSON, estrutura, tradução e timeout.
      // baseUrl e timeoutMs já chegam pela configuração do servidor.
      const erro = new Error('Implemente o client de categorias para continuar.');
      erro.status = 501;
      erro.codigo = 'EXERCICIO_PENDENTE';
      throw erro;
    }
  };
}
