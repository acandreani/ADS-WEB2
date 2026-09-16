# Encontro 8 — Texto 1: interface como cliente da API

Projeto independente e executável do exemplo do Texto 1. O Express serve
`index.html`, `estilos.css` e `app.js` da pasta `public/`; o navegador executa
o JavaScript e consulta a API separadamente.

## Executar

```bash
npm install
npm start
```

Abra `http://localhost:3000/`. Não abra `index.html` diretamente pelo sistema
de arquivos: a página e a API devem usar a mesma origem.

## Testar

```bash
npm test
```

O formulário envia `POST /tarefas`, limpa o campo após sucesso e recarrega a
lista. A função `renderizar` usa `textContent`, evitando interpretar o título
como HTML. A interface mostra carregamento, vazio, resultado e falha.

O texto usa `/tarefas`, enquanto a proposta do starter cita `/api/tarefas`.
Este projeto aceita ambos os caminhos como alias do mesmo router. A interface
utiliza `/tarefas` para corresponder literalmente ao exemplo do texto.

## Requisições observáveis no Network

- `GET /`: HTML estático;
- `GET /estilos.css`: CSS estático;
- `GET /app.js`: JavaScript estático;
- `GET /tarefas`: dados dinâmicos;
- `POST /tarefas`: criação dinâmica ao enviar o formulário.

O vetor de tarefas fica em memória; os dados são perdidos ao reiniciar o
servidor. O router também inclui `PATCH` e `DELETE`, como previsto no starter
do encontro, embora a interface do Texto 1 use apenas `GET` e `POST`.
