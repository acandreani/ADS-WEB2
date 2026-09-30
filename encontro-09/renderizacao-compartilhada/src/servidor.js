import { criarApp } from './app.js';

const porta = Number(process.env.PORTA ?? 3000);

const servidor = criarApp().listen(porta, () => {
  console.log(`Exemplo disponível em http://localhost:${porta}`);
});

// Mantém uma referência explícita e permite encerramento limpo no terminal.
process.once('SIGINT', () => servidor.close(() => process.exit(0)));
process.once('SIGTERM', () => servidor.close(() => process.exit(0)));
