import { AppError } from '../errors/app-error.js';

export function validarCriacaoTarefa(entrada) {
  if (
    entrada === null ||
    typeof entrada !== 'object' ||
    Array.isArray(entrada)
  ) {
    throw new AppError(
      'ENTRADA_INVALIDA',
      'O corpo deve ser um objeto JSON',
      400
    );
  }

  const detalhes = {};
  const titulo = typeof entrada.titulo === 'string'
    ? entrada.titulo.trim()
    : '';

  if (titulo.length < 3 || titulo.length > 120) {
    detalhes.titulo = 'Deve conter de 3 a 120 caracteres';
  }

  if (
    Object.hasOwn(entrada, 'concluida') &&
    typeof entrada.concluida !== 'boolean'
  ) {
    detalhes.concluida = 'Deve ser booleano';
  }

  if (Object.keys(detalhes).length > 0) {
    throw new AppError(
      'VALIDACAO_FALHOU',
      'Os dados enviados são inválidos',
      400,
      detalhes
    );
  }

  return {
    titulo,
    concluida: entrada.concluida ?? false
  };
}

export function lerId(texto) {
  if (typeof texto !== 'string' || !/^[1-9]\d*$/.test(texto)) {
    throw new AppError(
      'ID_INVALIDO',
      'O ID deve ser um inteiro positivo',
      400
    );
  }

  const id = Number(texto);

  if (!Number.isSafeInteger(id)) {
    throw new AppError(
      'ID_INVALIDO',
      'O ID deve ser um inteiro positivo',
      400
    );
  }

  return id;
}
