# ADS-WEB2

### Encontro 9 — Renderização de views

- [Mesma template EJS no cliente e no servidor, com comparação sem template](encontro-09/renderizacao-compartilhada/README.md)

Exercícios resolvidos da disciplina Desenvolvimento Web 2 do curso de
Tecnologia em Análise e Desenvolvimento de Sistemas.

## Organização

Cada solução fica em uma pasta própria, organizada por encontro e exercício.
Os projetos são independentes e possuem suas próprias instruções de execução.

## Soluções disponíveis

### Encontro 6 — Arquitetura em camadas

- [Exercício 3 — Atualizar em camadas](encontro-06/exercicio-03/README.md)

O exercício implementa `PATCH /tarefas/:id` com separação entre router,
controller, service e repository, injeção de dependências, validação e testes
automatizados.

### Encontro 7 — Validação e erros

- [Parte 2 — Tratamento central de erros](encontro-07/parte-02-erros/README.md)

O exemplo implementa validação, erros previstos, conflito, 404, JSON
malformado, request ID e proteção contra vazamento de detalhes internos.

### Encontro 8 — Interface como cliente da API

- [Texto 1 — Interface e API de tarefas](encontro-08/texto-01/README.md)
- [Lista 1, exercícios 2 e 3 — Estados da lista e conclusão de tarefas](encontro-08/lista-01-exercicios-02-03/README.md)

O projeto independente inclui uma interface HTML/CSS/JavaScript, servidor
Express e testes. O formulário cria tarefas por `POST /tarefas` e a página
atualiza a lista com `GET /tarefas`.

A solução da Lista 1 acrescenta estados de carregamento e erro, bloqueio do
botão durante a criação e um checkbox que envia `PATCH` e volta ao valor
anterior se a atualização falhar.
