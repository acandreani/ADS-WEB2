# Encontro 13 — Lista 2 resolvida

Projeto independente com as resoluções dos exercícios **4, 5 e 6**: migrações,
persistência entre processos e atualização otimista. Inclui uma API HTTP real,
repository SQLite e uma implementação em memória com o mesmo contrato.
Não depende dos projetos dos encontros anteriores.

## Executar

Requisito: **Node.js 24 ou superior** e npm. Dentro desta pasta:

```bash
npm ci
npm run ex4
npm run ex5
npm run ex6
npm test
npm start
```

Os três comandos de exercícios são demonstrações completas com verificações
automáticas: uma falha provoca erro, não apenas uma mensagem no console.
Os testes e demonstrações usam bancos temporários (removidos ao terminar)
ou `:memory:`; não alteram o banco da execução normal.
`npm start` mantém a API em `http://127.0.0.1:3013` e os dados em
`dados/tarefas.db`. Encerre com Ctrl+C.

## Organização

- `migrations/`: evolução do esquema em três passos.
- `src/db.js`: conexão e executor transacional de migrações.
- `src/repository.js`: SQL, mapeamento para DTO e alternativa em memória.
- `src/service.js`: validação e regras, sem SQL.
- `src/app.js`: composição das dependências e rotas HTTP.
- `src/server.js`: inicialização e encerramento do processo.
- `solucoes/exercicio-04.js`: migração em banco novo e banco v1 com dados.
- `solucoes/exercicio-05.js`: POST, encerramento real, reinício e GET.
- `solucoes/exercicio-06.js`: duas cópias da tarefa e conflito de versão.
- `lib/processo.js`: apoio às demonstrações com processos e requisições reais.
- `test/lista.test.js`: dez testes automatizados.

## Exercício 4 — Migração de prioridade

A migração `001_inicial.sql` estabelece o esquema v1. A migração
`002_prioridade.sql` acrescenta:

```sql
ALTER TABLE tarefas ADD COLUMN prioridade TEXT NOT NULL DEFAULT 'normal'
CHECK (prioridade IN ('baixa', 'normal', 'alta'));
```

O valor padrão permite migrar tarefas existentes sem apagá-las: cada tarefa
antiga recebe `normal`. O `CHECK` impede valores fora do domínio e o
`NOT NULL` impede ausência explícita do valor. O service também valida a
entrada, para devolver uma mensagem adequada antes de chegar ao banco.
O repository inclui a prioridade no INSERT, no UPDATE e no DTO retornado.

`npm run ex4` cria dois arquivos separados. No banco novo aplica 001, 002
e 003. No segundo, aplica somente 001, insere uma tarefa, fecha o banco e
então aplica 002 e 003. A tarefa antiga mantém seu título e passa a ter
prioridade `normal`; a nova tarefa é inserida com prioridade `alta`.
O programa imprime os DTOs e o histórico de migrações.

`schema_migrations` registra cada versão aplicada. Executar novamente não
reaplica os comandos: a demonstração verifica que a lista de novas migrações
fica vazia. O executor faz a leitura do histórico e toda a aplicação pendente
em uma transação imediata. Se uma etapa falhar, suas alterações e os registros
desse lote são desfeitos. Históricos com lacunas ou versões desconhecidas são
rejeitados, sem tentar adivinhar como reparar o banco.

Aqui, “banco v1” significa o banco criado pela migração 001 deste projeto.
Não há importação automática de bancos de outros exemplos da disciplina.

## Exercício 5 — Teste de persistência

`npm run ex5` executa a sequência inteira pela API:

1. Inicia um processo Node com um arquivo SQLite temporário.
2. Envia `POST /tarefas`, exige status **201** e guarda o ID e o DTO.
3. Encerra o processo e aguarda sua saída.
4. Inicia outro processo, apontando para o mesmo arquivo.
5. Envia `GET /tarefas/:id`, exige status **200** e compara todo o DTO.

O console registra o caminho do arquivo, os dois PIDs, os status HTTP e os
dados antes/depois. O ID e os campos devem permanecer iguais. Não se trata
apenas de fechar e abrir uma conexão dentro do mesmo servidor.

Para reproduzir manualmente, execute `npm start` e, em outro terminal:

```bash
curl -i -X POST http://127.0.0.1:3013/tarefas \
  -H 'Content-Type: application/json' \
  -d '{"titulo":"Conferir persistência","prioridade":"alta"}'
```

Anote o `id` retornado. Pare o servidor com Ctrl+C, execute `npm start`
novamente e consulte o ID anotado (substitua `1` abaixo, se necessário):

```bash
curl -i http://127.0.0.1:3013/tarefas/1
```

O arquivo, e não o objeto JavaScript, preserva os dados. Como controle
negativo, a suíte repete o reinício com SQLite `:memory:`: o GET deve retornar
**404**, pois o banco em memória desaparece com o processo.

## Exercício 6 — Atualização otimista

A migração `003_versao.sql` adiciona `versao`, um inteiro positivo com valor
inicial 1. Essa é a **versão da tarefa**, diferente da versão do esquema
registrada em `schema_migrations`.

O cliente lê uma tarefa e envia a versão que leu junto com a alteração:

```bash
curl -i -X PATCH http://127.0.0.1:3013/tarefas/1 \
  -H 'Content-Type: application/json' \
  -d '{"titulo":"Título revisado","versao":1}'
```

O núcleo da atualização é uma única instrução condicional (o código completo
também permite alterar conclusão e prioridade):

```sql
UPDATE tarefas
SET titulo = ?, versao = versao + 1
WHERE id = ? AND usuario_id = ? AND versao = ?;
```

Se duas pessoas carregaram a versão 1, a primeira atualização aceita retorna
**200** e versão 2. A segunda ainda envia 1: seu UPDATE altera zero linhas e
retorna **409 CONFLITO_VERSAO**. Assim, não sobrescreve silenciosamente a
alteração anterior. A verificação ocorre no próprio UPDATE, sem depender de
um SELECT prévio que poderia ficar desatualizado.

`npm run ex6` cria uma tarefa, obtém duas cópias por GET e envia as duas
alterações. Verifica uma resposta 200 e outra 409, além da versão final 2 e
do conteúdo da atualização vencedora. Não pressupõe qual requisição vence.
Após um conflito, o cliente deve recarregar a tarefa e permitir revisar ou
conciliar a edição; não deve repetir cegamente o conteúdo antigo com a nova
versão.

Por contrato, uma escrita condicional que altera zero linhas retorna 409
também quando o ID não existe ou pertence a outro usuário, sem revelar sua
existência. Um GET indisponível retorna 404. Como extensão, DELETE também
exige a versão, para evitar apagar uma tarefa modificada desde a leitura.

## Contrato da API

| Método e caminho | Entrada | Sucesso |
| --- | --- | --- |
| GET `/tarefas` | — | 200, lista do usuário |
| POST `/tarefas` | `titulo`, opcionais `prioridade` e `concluida` | 201, tarefa |
| GET `/tarefas/:id` | — | 200, tarefa |
| PATCH `/tarefas/:id` | `versao` e ao menos um campo editável | 200, tarefa com versão incrementada |
| DELETE `/tarefas/:id?versao=1` | versão atual na query | 204, sem corpo |

Título: de 3 a 120 caracteres após remover espaços nas extremidades.
Prioridade: `baixa`, `normal` (padrão) ou `alta`. Conclusão: booleano,
inicialmente `false`. A versão não é escolhida na criação e não pode ser
alterada livremente. Campos desconhecidos e entradas inválidas retornam 400.

A identidade é **simulada** pelo header `X-Usuario-Id: 1` (padrão, Ada) ou
`X-Usuario-Id: 2` (Bruno). Isso não é autenticação: serve apenas ao laboratório
local. A API escuta somente em loopback e não deve ser exposta como aplicação
de produção. Erros inesperados são registrados no servidor; a resposta 500
não inclui SQL nem stack trace.

Para trocar o armazenamento, no Bash:

```bash
ARMAZENAMENTO=memoria npm start
```

O service e as rotas permanecem iguais; apenas a composição seleciona outro
repository. Nesse modo os dados não sobrevivem ao reinício. Para escolher
outro arquivo SQLite, use `DB_PATH=/caminho/para/tarefas.db npm start`.

## Verificações automatizadas

`npm test` cobre migração nova e v1 com preservação dos dados; idempotência;
restrições de prioridade; rollback de migração que falha; rejeição de versão
de esquema desconhecida; CRUD e conflito via HTTP nos dois repositories;
conflito entre duas conexões SQLite ao mesmo arquivo; persistência entre
processos e controle negativo com banco em memória.
