import { ErroAplicacao } from './erros.js';

// Função pura da borda HTTP: não expõe SQL, stack ou cause na resposta pública.
// Uma API real aplicaria res.status(resultado.status).json(resultado.body).
export function respostaErro(erro, requestId, registrar = console.error) {
  registrar({ requestId, erro });
  if (erro instanceof ErroAplicacao) {
    return { status: erro.status, body: { codigo: erro.codigo, mensagem: erro.message, requestId } };
  }
  return { status: 500, body: { codigo: 'ERRO_INTERNO', mensagem: 'Erro interno', requestId } };
}
