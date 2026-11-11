import { ErroAplicacao } from './erros.js';

export function validarId(id) {
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new ErroAplicacao('DADOS_INVALIDOS', 'ID deve ser inteiro positivo', 400);
  }
}

export function validarCampos(dados, { parcial = false } = {}) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    throw new ErroAplicacao('DADOS_INVALIDOS', 'Informe um objeto', 400);
  }
  const campos = Object.keys(dados);
  if (campos.length === 0 || campos.some(c => !['titulo', 'concluida'].includes(c))) {
    throw new ErroAplicacao('DADOS_INVALIDOS', 'Informe titulo e/ou concluida; outros campos nao sao aceitos', 400);
  }
  const resultado = {};
  if (!parcial || Object.hasOwn(dados, 'titulo')) {
    const titulo = typeof dados.titulo === 'string' ? dados.titulo.trim() : '';
    if (Array.from(titulo).length < 3 || Array.from(titulo).length > 120 || titulo.includes('\0')) {
      throw new ErroAplicacao('DADOS_INVALIDOS', 'Titulo deve ter de 3 a 120 caracteres e nao conter NUL', 400);
    }
    resultado.titulo = titulo;
  }
  if (Object.hasOwn(dados, 'concluida')) {
    if (typeof dados.concluida !== 'boolean') {
      throw new ErroAplicacao('DADOS_INVALIDOS', 'concluida deve ser booleano', 400);
    }
    resultado.concluida = dados.concluida;
  } else if (!parcial) resultado.concluida = false;
  return resultado;
}
