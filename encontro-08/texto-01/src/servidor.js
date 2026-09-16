import { criarApp } from './app.js';

const porta = Number(process.env.PORTA ?? 3000);
if (!Number.isSafeInteger(porta) || porta < 1 || porta > 65535) {
  throw new Error('PORTA deve ser um inteiro entre 1 e 65535');
}

criarApp().listen(porta, () => {
  console.log(`Abra http://localhost:${porta}/`);
});
