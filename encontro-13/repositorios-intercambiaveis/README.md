# A fronteira permite trocar o armazenamento · Repository SQLite

Código funcional dos dois trechos do **caderno 13**, com `better-sqlite3`.
É um projeto novo e independente; não abre bancos dos encontros anteriores.
Há um service e duas implementações do mesmo contrato. A escolha ocorre somente
em [`src/composicao.js`](src/composicao.js).

## Executar

Requisito: **Node.js 24+**, recomendado para manter a mesma versão usada na aula 12.
Abra o terminal nesta pasta e execute:

```sh
npm ci
npm test
npm run demo:memoria
npm run demo:sqlite
npm run listar:sqlite
```

A primeira instalação usa a internet. O driver é nativo: se não houver binário
pré-compilado para sua plataforma, a instalação pode exigir Python e ferramentas
de compilação C/C++. O `package-lock.json` fixa as versões instaladas.

`demo:memoria` começa vazio a cada processo. `demo:sqlite` cria automaticamente
`dados/tarefas.db`, duas pessoas fictícias e, a cada execução, **mais uma tarefa
concluída de Ada**. A demonstração também cria e remove uma tarefa temporária.
Nenhum comando apaga as tarefas de execuções anteriores.

`listar:sqlite` abre outro processo e lista o que ficou salvo. Esse comando não
cria novas tarefas, embora inicialize o esquema e os usuários se o banco for novo.
Para ver a memória vazia em outro processo: `node src/main.js memoria listar`.
Para outro arquivo, configure `DB_PATH`:

```sh
# Bash
DB_PATH=./dados/outro.db npm run demo:sqlite
```

```powershell
# PowerShell
$env:DB_PATH = './dados/outro.db'
npm run demo:sqlite
```

Os caminhos relativos de `DB_PATH` partem do diretório atual. O caminho padrão
é relativo ao projeto. Não aponte este exemplo para um banco real ou de outra aula.
Para recomeçar, feche o programa e guarde o banco anterior como backup, ou use
outro `DB_PATH`; não há reset destrutivo.

## Onde está cada responsabilidade

| Arquivo | Responsabilidade |
| --- | --- |
| `src/main.js` | Demonstração no terminal; fecha recursos em `finally` |
| `src/composicao.js` | Abre/inicializa o banco quando necessário, escolhe e injeta o repository |
| `src/service.js` | Validação, casos de uso e propriedade das tarefas; não conhece SQL |
| `src/repositories/memoria.js` | Armazena em `Map` e devolve cópias |
| `src/repositories/sqlite.js` | Statements preparados, parâmetros, CRUD e mapeamento |
| `src/db.js` | Conexão, FK, WAL e inicialização |
| `src/schema.sql` | Tabelas e usuários fictícios |
| `test/contrato.test.js` | Mesmos cenários para memória e SQLite; persistência entre processos |

Não há servidor HTTP nesta demonstração: o terminal chama os casos de uso
diretamente. Isso concentra o exemplo na fronteira de persistência.

## Contrato do repository

As operações são assíncronas na interface (`Promise`), mesmo com o driver
síncrono. O service faz `await` da mesma forma nos dois armazenamentos.

| Operação | Retorno | Ausência |
| --- | --- | --- |
| `listarPorUsuario(usuarioId)` | Array em ordem crescente de ID | `[]` |
| `buscarPorId(id)` | Objeto de tarefa | `null` |
| `inserir({titulo, concluida, usuarioId})` | Objeto persistido, com ID e data | Usuário inexistente gera erro conhecido |
| `atualizar(id, usuarioId, alteracoes)` | Objeto final | `null` para tarefa ausente ou alheia |
| `remover(id, usuarioId)` | Booleano | `false` para tarefa ausente ou alheia |

Modelo devolvido:

```js
{
  id: 1,
  titulo: 'Estudar repository SQLite',
  concluida: false,
  usuarioId: 1,
  criadoEm: '2026-11-11T12:00:00.000Z'
}
```

A data acima é ilustrativa. As duas implementações geram ISO UTC com o mesmo
relógio injetável. No SQLite, `usuario_id`/`criado_em` viram `usuarioId`/`criadoEm`
e `0/1` vira booleano. Nenhuma camada consumidora precisa fazer essa conversão.

O contrato pressupõe IDs e dados já validados pelo service. A aplicação aceita
títulos com 3–120 caracteres, booleanos reais e não aceita trocar proprietário
pelo patch. O banco mantém restrições adicionais como última proteção, inclusive
para escritas fora do service; o `Map` não tenta reproduzir um motor SQL completo.

`buscarPorId` é uma operação interna que não filtra usuário, como sugerido no
caderno. Por isso, o service confere o proprietário antes de devolver a tarefa.
Atualização e remoção já filtram proprietário **na própria escrita**, evitando
fazer uma leitura prévia como único controle. Em uma API real, `usuarioId` viria
da autenticação; aqui usamos os IDs fictícios 1 (Ada) e 2 (Bruno).

## A troca acontece na composição

```js
// Ambas as linhas criam o mesmo service; só muda o objeto injetado.
const service = criarTarefasService(criarTarefasRepository());
// ou, com a conexão inicializada:
const service = criarTarefasService(criarTarefasSqlite(db));
```

São alternativas, não duas declarações para colar juntas no mesmo escopo.
O arquivo executável `composicao.js` realiza essa escolha e mantém a conexão
fora das operações individuais. A conexão é encerrada em `app.fechar()`.

## Complementos ao trecho do caderno

- `buscarPorId`, atualização parcial, remoção e esquema foram implementados;
  o fragmento do caderno só mostrava parte do repository.
- A inserção usa uma função fechada sobre o statement de busca, em vez de
  `this.buscarPorId`. Assim `const { inserir } = repository` também funciona.
- Atualizar só `titulo` preserva `concluida`; atualizar para `false` funciona.
  Flags explícitas distinguem campo ausente de booleano falso.
- Inserir/atualizar e consultar o resultado ocorrem em transações curtas. O
  `better-sqlite3` faz rollback se a função da transação lançar um erro.
- FK, CHECK e NOT NULL conhecidos são traduzidos em erros de aplicação com
  `cause` preservada. Outros erros continuam inesperados, sem serem escondidos
  como validação. Como este exemplo não possui API, não há middleware HTTP;
  uma API os trataria como falha interna com resposta pública controlada.
- `UNIQUE` de email existe no esquema, mas não há cadastro de usuários neste
  exemplo. Não se traduz uma violação que esta API de tarefas não utiliza.

## O que os testes demonstram

O mesmo conjunto de testes verifica retornos, ausência, ordenação, isolamento por
usuário, update parcial, remoção, cópias dos objetos e uso do mesmo service.
Há testes de parâmetros, mapeamento, validação, erros inesperados e persistência
entre **dois processos Node diferentes**, usando banco temporário.

WAL só é habilitado efetivamente em bancos em arquivo; um banco `:memory:` usa
o modo de journal em memória. Os testes de WAL utilizam um arquivo real temporário.

## Limites deste exemplo

`CREATE TABLE IF NOT EXISTS` torna a inicialização repetível, mas **não migra**
uma tabela existente para outro formato. Migrações versionadas e atualização
otimista pertencem aos outros tópicos do caderno e não são implementadas aqui.

O driver é síncrono: declarar métodos `async` padroniza a interface, mas não
transforma I/O síncrono em não bloqueante. Este é um laboratório de arquitetura,
não uma promessa de desempenho para cargas grandes.

Referência do driver: [better-sqlite3](https://github.com/WiseLibs/better-sqlite3).
