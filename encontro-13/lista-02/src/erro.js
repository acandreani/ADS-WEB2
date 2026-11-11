export class ErroAplicacao extends Error {
  constructor(status, codigo, mensagem) { super(mensagem); this.status = status; this.codigo = codigo; }
}
export const conflito = () => new ErroAplicacao(409, 'CONFLITO_VERSAO', 'Tarefa indisponivel ou versao desatualizada');
