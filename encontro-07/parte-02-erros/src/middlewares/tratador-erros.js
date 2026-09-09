import { AppError } from '../errors/app-error.js';

function corpoPublico({ codigo, mensagem, detalhes, requestId }) {
  return {
    codigo,
    mensagem,
    ...(detalhes === undefined ? {} : { detalhes }),
    requestId
  };
}

export function criarTratadorDeErros(logger = console) {
  return function tratarErro(erro, req, res, next) {
    const jsonMalformado = (
      erro instanceof SyntaxError &&
      erro.status === 400 &&
      'body' in erro
    );

    if (jsonMalformado) {
      return res.status(400).json(corpoPublico({
        codigo: 'JSON_INVALIDO',
        mensagem: 'O corpo contém JSON malformado',
        requestId: req.requestId
      }));
    }

    if (erro instanceof AppError) {
      return res.status(erro.status).json(corpoPublico({
        codigo: erro.codigo,
        mensagem: erro.message,
        detalhes: erro.detalhes,
        requestId: req.requestId
      }));
    }

    logger.error({
      requestId: req.requestId,
      mensagem: erro.message,
      stack: erro.stack
    });

    return res.status(500).json(corpoPublico({
      codigo: 'ERRO_INTERNO',
      mensagem: 'Erro interno',
      requestId: req.requestId
    }));
  };
}
