import { criarApp } from './app.js';

const porta = Number(process.env.PORTA ?? 3000);
if (!Number.isInteger(porta) || porta < 1 || porta > 65535) {
  throw new Error('PORTA deve ser um inteiro entre 1 e 65535.');
}

const servidor = criarApp().listen(porta, () => {
  console.log(`Starter do encontro 10: http://localhost:${porta}/tarefas`);
});
servidor.on('error', (erro) => {
  console.error(`Não foi possível iniciar o servidor: ${erro.message}`);
  process.exitCode = 1;
});
