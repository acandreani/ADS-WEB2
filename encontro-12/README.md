# Encontro 12 — SQL e SQLite

Projeto independente do caderno 12: modelo relacional, restrições, CRUD,
parâmetros, propriedade dos dados e transações. Nenhum banco ou servidor de
encontros anteriores é utilizado. Não há Express nem serviço externo nesta aula.

## Começar

Use **Node.js 24 ou superior** (`node --version`). Este encontro usa o módulo
integrado `node:sqlite`; não exige `npm install`, pacotes nativos ou acesso à
internet durante os exercícios. Algumas versões do Node exibem um aviso
`ExperimentalWarning` do módulo; isso não é uma falha dos testes.

Baixe o repositório pelo GitHub (Code → Download ZIP) e extraia, ou clone-o.
Abra o terminal na pasta `encontro-12` e execute:

```sh
node --version
npm run pratica
npm test
```

`pratica` executa criação/seed, listagem, filtro, atualização e remoção em
memória, mostrando antes/depois e linhas afetadas. Cada execução começa do
zero e não modifica seus arquivos.

Para trabalhar num banco persistente, novo e exclusivo desta aula:

```sh
npm run db:criar
```

Isso cria `encontro12-sql/tarefas.db` dentro desta pasta, com **dois usuários e
quatro tarefas**, conforme a prática guiada. O caminho absoluto é impresso.
Se o arquivo já existir, o comando recusa a operação; renomeie-o como backup
antes de criar outro. Não há comando de reset destrutivo.

Para começar um banco novo com dados adicionais para os exercícios 2 e 3:

```sh
npm run db:criar -- --extras
```

Escolha uma das duas formas para cada banco novo. O complemento adiciona Carla
(sem tarefas) e dez tarefas de Ada: o resultado tem três usuários e quatorze
tarefas. Assim a segunda página não fica artificialmente vazia. Os exemplos
resolvidos 2 e 3 carregam esse complemento automaticamente, em memória.

## Organização

```text
encontro-12/
  sql/schema.sql              tabelas usuarios e tarefas do caderno
  sql/seed.sql                dois usuários e quatro tarefas
  sql/seed-exercicios.sql     complemento para paginação e agregação
  aluno/exercicios.sql        espaço para escrever as seis respostas
  aluno/exercicios.js         base executável, sem as soluções
  exemplos/pratica-guiada.js  demonstração de CRUD
  solucoes/exercicio-01/      restrições
  solucoes/exercicio-02/      listagem parametrizada
  solucoes/exercicio-03/      agregação com LEFT JOIN
  solucoes/exercicio-04/      atualização por proprietário
  solucoes/exercicio-05/      concatenação versus parâmetros
  solucoes/exercicio-06/      histórico e transação com rollback
  test/exercicios.test.js     verificações automatizadas
```

A tabela `historico` é criada na solução do exercício 6, que pede justamente
essa criação. Sua definição está em `solucoes/exercicio-06/historico.sql`.
O esquema inicial não antecipa essa resposta.

## Trabalhar antes de consultar o gabarito

Escreva suas consultas em `aluno/exercicios.sql` e/ou implemente-as em
`aluno/exercicios.js`. Execute o arquivo JavaScript com:

```sh
node aluno/exercicios.js
```

Ele abre um banco novo em memória com os dados adicionais. Para abrir seu banco
persistente em um programa, use `abrirBanco(caminho)` de `lib/banco.js`, habilitando
chaves estrangeiras nessa conexão. Não execute `preparar` num banco já preparado.
Os testes fornecidos verificam as soluções publicadas; não avaliam automaticamente
o que você escrever nos arquivos de prática.

## Alternativa: console SQLite

O executável `sqlite3` é opcional neste projeto. Se estiver instalado, você pode
usar o fluxo do caderno diretamente, após `npm run db:criar`:

```sh
sqlite3 encontro12-sql/tarefas.db
```

No prompt SQLite:

```sql
.headers on
.mode column
PRAGMA foreign_keys = ON;
PRAGMA foreign_keys;
SELECT * FROM tarefas;
```

Para aplicar os arquivos manualmente, abra um arquivo de banco **novo**, use
`.read sql/schema.sql` e `.read sql/seed.sql`. O complemento opcional é
`.read sql/seed-exercicios.sql`. Não aplique seeds repetidamente no mesmo banco.
Para o exercício 6, use `.read solucoes/exercicio-06/historico.sql` uma vez.

Parâmetros no console exigem vinculação, não basta colar `?` sem valores:

```sql
.parameter init
.parameter set ?1 1
.parameter set ?2 %sql%
.read solucoes/exercicio-02/consulta.sql
```

Se um comando dentro de uma transação falhar, execute `ROLLBACK` antes de
continuar. A opção JavaScript demonstra esse tratamento automaticamente.

## API executável versus pseudocódigo do caderno

O caderno mostra `db.get(sql, [id])` como forma ilustrativa de vincular valores.
Aqui, com `node:sqlite`, a forma é:

```js
const tarefa = db.prepare('SELECT * FROM tarefas WHERE id = ?').get(id);
const linhas = db.prepare('SELECT * FROM tarefas WHERE usuario_id = ?').all(usuarioId);
const resultado = db.prepare('UPDATE tarefas SET titulo = ? WHERE id = ? AND usuario_id = ?')
  .run(titulo, id, usuarioId);
console.log(resultado.changes);
```

Os valores são argumentos separados, **não** um array único. `exec` é reservado
a SQL fixo de esquema/transação. Não coloque dados do usuário em `exec` nem
interpolações em consultas. A única exceção é a demonstração vulnerável
explicitamente marcada no exercício 5, executada somente em banco fictício.

## Executar as soluções

```sh
npm run ex1
npm run ex2
npm run ex3
npm run ex4
npm run ex5
npm run ex6
```

Todos esses comandos usam bancos descartáveis em memória. Leia as explicações,
resultados esperados e limites em [solucoes/README.md](solucoes/README.md).
A numeração é contínua: lista 1 = exercícios 1–3; lista 2 = exercícios 4–6.

## Cuidados e limites

- `PRAGMA foreign_keys = ON` é por conexão e deve ser aplicado antes de `BEGIN`.
- O esquema acompanha o caderno: não foi convertido para tabelas `STRICT`.
- `NOT NULL` não proíbe string vazia; só o título tem `CHECK` de comprimento.
- `INTEGER PRIMARY KEY` permite omitir o ID para geração automática; não use
  ID nulo como exemplo de falha de chave primária.
- `lower()`/ordenação padrão do SQLite não equivalem a busca e ordenação
  linguística completas em português. Os dados de paginação usam texto ASCII.
- Uma API real obteria `usuarioId` da autenticação; este laboratório não implementa login.
- O histórico aqui tem exclusão em cascata, escolhida para o banco didático.
  Não é um registro de auditoria permanente; tal requisito exigiria outra política.

Referências: [Node.js — SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html),
[SQLite — SQL](https://www.sqlite.org/lang.html) e
[SQLite — chaves estrangeiras](https://www.sqlite.org/foreignkeys.html).
