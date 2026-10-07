# Encontro 10 — Starter da API de tarefas

Este é o projeto-base mencionado no caderno 10. É independente dos demais
encontros e não contém as soluções dos exercícios. Use Node.js 20 ou superior.

## Executar

Após clonar o repositório, entre nesta pasta:

```bash
cd encontro-10/starter
npm ci
npm start
```

Abra <http://localhost:3000/tarefas>. Para encerrar, pressione Ctrl+C.
`npm run dev` reinicia o servidor quando você altera arquivos.

## O que já está pronto

- Express com `GET /tarefas` e `GET /tarefas/:id`.
- Vetor com 27 tarefas fictícias, criado em `src/dados.js`.
- Campos `id`, `titulo`, `concluida`, `usuarioId`, `notaInterna` e `criadoEm`.
- Respostas 400 para ID inválido e 404 para tarefa ou rota inexistente.

`criadoEm` foi incluído porque a Lista 2 pede ordenação por esse campo.
Há tarefas concluídas e pendentes em todas as partes do vetor, títulos e
datas repetidos, para testar filtros, paginação e desempate por ID.
Os dados são recriados ao iniciar a aplicação; não há banco de dados.

## Comportamento inicial e atividades

Na versão inicial, a listagem retorna um array completo. Parâmetros de consulta
são ignorados: paginação, filtros e ordenação ainda serão implementados.
Os objetos internos, inclusive `notaInterna`, são devolvidos intencionalmente
para o exercício de DTO. Todos os valores são fictícios; o starter é didático.

1. Audite plural, versão, status, formato de erro, tipos e datas. O enunciado
   permite confirmar consistências; não é necessário inventar cinco defeitos.
2. Implemente `pagina`, `limite`, validação e metadados; limite máximo 100.
3. Implemente `concluida` e `q`, filtrando antes de paginar.
4. Implemente `ordenar=criadoEm|titulo`, `direcao=asc|desc` e desempate por ID.
5. Crie DTOs que removam `notaInterna` de todas as respostas e justifique a
   decisão sobre `usuarioId`. Esses campos já estão presentes no starter.
6. Documente os endpoints e exemplos executáveis. Ao final, use `/api/v1`.

Exemplos que funcionam agora:

```bash
curl -i http://localhost:3000/tarefas
curl -i http://localhost:3000/tarefas/1
curl -i http://localhost:3000/tarefas/999
curl -i http://localhost:3000/tarefas/abc
curl -i http://localhost:3000/inexistente
```

## Verificação inicial

```bash
npm test
```

O teste verifica o starter original. Ao implementar versionamento e DTO,
atualize as URLs e expectativas do teste e acrescente os casos pedidos no
caderno. Este teste inicial não é o gabarito dos exercícios.
