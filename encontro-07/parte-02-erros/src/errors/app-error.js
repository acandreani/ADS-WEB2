export class AppError extends Error {
  constructor(codigo, mensagem, status = 400, detalhes = undefined) {
    super(mensagem);
    this.name = 'AppError';
    this.codigo = codigo;
    this.status = status;
    this.detalhes = detalhes;
  }
}
