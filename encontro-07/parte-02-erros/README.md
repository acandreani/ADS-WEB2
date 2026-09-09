# Encontro 7 — Parte 2: tratamento central de erros

Exemplo completo do segundo texto do Encontro 7. A aplicação demonstra:

- `AppError` para falhas previstas;
- validação pura com erros acumulados por campo;
- service lançando erros de validação, ausência e conflito;
- controllers sem `try/catch` repetitivo;
- middleware central de erros;
- conversão de JSON malformado em resposta `400` padronizada;
- resposta `404` ao final da pilha;
- `requestId` no cabeçalho e em todas as respostas de erro;
- erro inesperado registrado internamente sem vazar detalhes ao cliente.

## Instalação

```bash
npm install
```

## Execução

```bash
npm start
```

A API ficará disponível em `http://localhost:3000`.

## Testes automatizados

```bash
npm test
```

Os testes cobrem validação, criação, conflito, ausência, ID inválido, JSON
malformado, 404, request ID e não vazamento de erro interno.

## Rotas

| Método | Caminho | Resultado principal |
|---|---|---|
| `GET` | `/saude` | Verificação do servidor |
| `POST` | `/tarefas` | Criação de tarefa |
| `GET` | `/tarefas/:id` | Consulta por ID |

## Criar uma tarefa

```bash
curl -i \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"titulo":"Estudar tratamento de erros"}' \
  http://localhost:3000/tarefas
```

Resposta esperada: status `201`, cabeçalho `Location: /tarefas/1` e a tarefa
criada.

## Validação com vários campos inválidos

```bash
curl -i \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"titulo":"ab","concluida":"false"}' \
  http://localhost:3000/tarefas
```

Resposta esperada:

```json
{
  "codigo": "VALIDACAO_FALHOU",
  "mensagem": "Os dados enviados são inválidos",
  "detalhes": {
    "titulo": "Deve conter de 3 a 120 caracteres",
    "concluida": "Deve ser booleano"
  },
  "requestId": "..."
}
```

## JSON malformado

```bash
curl -i \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"titulo":"Incompleto"' \
  http://localhost:3000/tarefas
```

Resposta esperada: status `400` e código `JSON_INVALIDO`.

## Demonstração temporária de não vazamento

A rota de defeito fica desabilitada por padrão. Para realizar apenas o
experimento do material, execute:

```bash
HABILITAR_ROTA_DEBUG=true npm start
```

Em outro terminal:

```bash
curl -i http://localhost:3000/debug/erro
```

O cliente recebe `ERRO_INTERNO`, sem a mensagem sensível. O terminal do
servidor registra `requestId`, mensagem e stack. Encerre o servidor e volte a
executá-lo sem `HABILITAR_ROTA_DEBUG` ao terminar a demonstração.

## Ordem da pilha

```text
request ID
    ↓
express.json()
    ↓
rotas
    ↓
404
    ↓
tratador central de erros
```

O middleware de erro possui quatro parâmetros e permanece depois das rotas.
