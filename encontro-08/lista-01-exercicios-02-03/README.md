# Encontro 8 — Lista 1, exercícios 2 e 3

Solução completa e independente. O servidor Express entrega a interface e uma
API de tarefas em memória. Não depende do projeto do Texto 1 nem de outros
encontros.

## Executar

```bash
npm ci
npm start
```

Abra <http://localhost:3000/>. Para rodar os testes: `npm test`.

## O que observar

- **Exercício 2:** `carregarTarefas()` mostra carregamento, mensagem de lista
  vazia, tarefas recebidas e erro. O botão Adicionar fica desabilitado durante
  o `POST` e é reabilitado no `finally`, inclusive quando há falha.
- **Exercício 3:** cada tarefa possui um checkbox. A mudança envia
  `PATCH /tarefas/:id` com `{ "concluida": true/false }`. Enquanto espera, o
  checkbox fica desabilitado. Se a requisição falhar, ele volta ao valor
  anterior e a mensagem de erro aparece na página.

Para observar o caminho de falha do checkbox, crie uma tarefa, abra as
ferramentas do navegador, selecione **Offline** na aba Network e altere o
checkbox. Ele deve voltar ao estado anterior. Desative Offline e tente de novo.

A API aceita `/tarefas` (caminho usado no texto) e `/api/tarefas` (caminho
indicado no starter). Os dados são perdidos ao reiniciar o servidor.

## Arquivos principais

- `public/app.js`: estados da listagem, criação, checkbox e reversão visual;
- `public/index.html` e `public/estilos.css`: interface;
- `src/app.js` e `src/servidor.js`: API e servidor estático;
- `test/app.test.js`: testes HTTP do projeto.
