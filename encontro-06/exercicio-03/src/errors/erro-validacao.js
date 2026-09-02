export class ErroValidacao extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = 'ErroValidacao';
  }
}
