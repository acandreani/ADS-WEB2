export class ErroAplicacao extends Error {
  constructor(codigo, mensagem, status, options) {
    super(mensagem, options);
    this.name = 'ErroAplicacao';
    this.codigo = codigo;
    this.status = status;
  }
}

export function traduzirErroSqlite(erro) {
  // Não transforme falha de disco, SQL inválido ou conexão fechada em erro do usuário.
  const mensagens = {
    SQLITE_CONSTRAINT_FOREIGNKEY: ['USUARIO_INEXISTENTE', 'Usuario inexistente', 400],
    SQLITE_CONSTRAINT_CHECK: ['DADOS_INVALIDOS', 'Dados violam as regras da tarefa', 400],
    SQLITE_CONSTRAINT_NOTNULL: ['DADOS_INVALIDOS', 'Campo obrigatorio ausente', 400]
  };
  const regra = mensagens[erro.code];
  return regra ? new ErroAplicacao(...regra, { cause: erro }) : erro;
}
