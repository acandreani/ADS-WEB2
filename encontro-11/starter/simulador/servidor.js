import { criarSimulador } from './app.js';

const modo = process.env.MODO ?? 'normal';
const porta = Number(process.env.PORTA_CATEGORIAS ?? 4000);
criarSimulador({ modo }).listen(porta, () => {
  console.log(`Categorias: http://localhost:${porta} — modo ${modo}`);
});
