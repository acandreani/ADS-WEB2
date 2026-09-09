import assert from 'node:assert/strict';
import test from 'node:test';

import { AppError } from '../src/errors/app-error.js';
import {
  lerId,
  validarCriacaoTarefa
} from '../src/validators/tarefas-validator.js';

test('normaliza uma tarefa válida', () => {
  assert.deepEqual(
    validarCriacaoTarefa({ titulo: '  Estudar erros  ' }),
    { titulo: 'Estudar erros', concluida: false }
  );
});

test('acumula erros de titulo e concluida', () => {
  assert.throws(
    () => validarCriacaoTarefa({
      titulo: 'ab',
      concluida: 'false'
    }),
    (erro) => {
      assert.ok(erro instanceof AppError);
      assert.equal(erro.codigo, 'VALIDACAO_FALHOU');
      assert.deepEqual(erro.detalhes, {
        titulo: 'Deve conter de 3 a 120 caracteres',
        concluida: 'Deve ser booleano'
      });
      return true;
    }
  );
});

test('lerId aceita somente inteiro positivo em texto', () => {
  assert.equal(lerId('12'), 12);
  assert.throws(() => lerId('12abc'), AppError);
  assert.throws(() => lerId('0'), AppError);
  assert.throws(() => lerId('1.5'), AppError);
});
