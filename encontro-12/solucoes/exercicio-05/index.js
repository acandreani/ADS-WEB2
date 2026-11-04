import { demonstrar } from '../../lib/banco.js';

// Apenas SELECT num banco fictício em memória. Não conectar a dados reais.
export function comparar(db, entrada = '1 OR 1=1') {
  const vulneravel = `SELECT id, titulo FROM tarefas WHERE id = ${entrada}`;
  const segura = 'SELECT id, titulo FROM tarefas WHERE id = ?';
  return {
    consultaVulneravel: vulneravel,
    concatenada: db.prepare(vulneravel).all(),
    parametrizada: db.prepare(segura).all(entrada)
  };
}
demonstrar(import.meta.url, db => {
  const resultado = comparar(db);
  console.log(resultado.consultaVulneravel);
  console.log('Concatenada: devolve todas as quatro tarefas.');
  console.table(resultado.concatenada);
  console.log('Parametrizada: a string é um valor, não uma expressão SQL.');
  console.table(resultado.parametrizada);
  console.log('ID válido, parametrizado:', db.prepare('SELECT id FROM tarefas WHERE id = ?').get(1));
});
