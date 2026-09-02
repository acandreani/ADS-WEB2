# Resolução completa — Encontro 6, Exercício 3

Implementação da atualização parcial de tarefas em quatro camadas:

```text
PATCH /tarefas/:id
```

## Responsabilidades

- `routes`: associa método e caminho ao controller;
- `controllers`: traduz HTTP, parâmetros e status;
- `services`: escolhe campos permitidos, valida e verifica existência;
- `repositories`: atualiza o armazenamento em memória;
- `errors`: representa falhas de validação sem depender de HTTP.

O ponto de composição fica em `src/app.js`. Express não é importado pelo
service nem pelo repository, e o controller não importa o repository.

## Instalação e execução

```bash
npm install
npm start
```

O servidor será iniciado em `http://localhost:3000`. Outra porta pode ser
escolhida sem modificar o código:

```bash
PORTA=3001 npm start
```

## Testes automatizados

```bash
npm test
```

Os testes do service e do repository usam apenas o executor nativo do Node.js.

## Testes HTTP manuais

Listar tarefas:

```bash
curl -i http://localhost:3000/tarefas
```

Consultar uma tarefa:

```bash
curl -i http://localhost:3000/tarefas/1
```

Alterar somente o título:

```bash
curl -i \
  -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"titulo":"  Estudar services  "}' \
  http://localhost:3000/tarefas/1
```

Alterar somente a conclusão:

```bash
curl -i \
  -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"concluida":true}' \
  http://localhost:3000/tarefas/1
```

Tentar alterar uma tarefa inexistente:

```bash
curl -i \
  -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"concluida":true}' \
  http://localhost:3000/tarefas/999
```

Tentar enviar um título vazio:

```bash
curl -i \
  -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"titulo":"   "}' \
  http://localhost:3000/tarefas/1
```

Tentar enviar uma string no lugar de booleano:

```bash
curl -i \
  -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"concluida":"true"}' \
  http://localhost:3000/tarefas/1
```

## Resultados esperados

| Situação | Status |
|---|---:|
| Atualização realizada | `200` |
| ID inválido | `400` |
| Corpo ou campos inválidos | `400` |
| Tarefa inexistente | `404` |
| Falha inesperada | `500` |

O service cria um novo objeto `alteracoes` somente com `titulo` e
`concluida`. Por isso, o cliente não consegue alterar o identificador enviando
um campo `id` no corpo.
