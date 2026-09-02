import { app } from './app.js';

const porta = Number(process.env.PORTA ?? 3000);

app.listen(porta, () => {
  console.log(`Servidor executando em http://localhost:${porta}`);
});
