# Encontro 13 — Resolução da Lista 1

Resoluções completas dos exercícios **Contrato do repository**, **CRUD SQLite**
e **Erros de restrição**. Projeto independente, baseado no exemplo publicado da
primeira parte da aula; não precisa instalar nem executar outra pasta.

## Executar

Com Node.js 24+, abra o terminal nesta pasta:

```sh
npm ci
npm run ex1
npm run ex2
npm run ex3
npm test
```

A instalação usa a internet e o driver `better-sqlite3` (dependência nativa).
Se não houver binário compatível com sua plataforma, poderão ser necessárias
ferramentas de compilação C/C++ e Python. Os três exercícios usam bancos
descartáveis em memória. Nenhum banco das aulas anteriores é aberto ou alterado.

## Exercício 1 — Contrato do repository

[Demonstração executável](solucoes/exercicio-01.js) · `npm run ex1`

O service precisa destas operações, todas retornando `Promise`:

| Assinatura | Sucesso | Ausência ou tarefa de outro usuário | Linhas escritas |
| --- | --- | --- | --- |
| `listarPorUsuario(usuarioId)` | `Tarefa[]`, ordenadas por ID | `[]` se nenhuma tarefa | 0 |
| `buscarPorId(id)` | `Tarefa` | `null` se ID ausente; propriedade é conferida pelo service | 0 |
| `inserir({titulo, concluida, usuarioId})` | `Tarefa` com ID e data | Usuário inexistente: erro `USUARIO_INEXISTENTE` | 1 em sucesso; 0 em falha |
| `atualizar(id, usuarioId, alteracoes)` | `Tarefa` final | `null` se inexistente ou alheia | 1 ou 0 |
| `remover(id, usuarioId)` | `true` se removeu | `false` se inexistente ou alheia | 1 ou 0 |

`Tarefa` tem `{id, titulo, concluida, usuarioId, criadoEm}`. `concluida` é
booleano JavaScript; `criadoEm` é string ISO UTC. O repository não devolve
`usuario_id`, inteiros usados como booleanos nem resultados internos do driver.

Precondições: IDs inteiros positivos e dados já validados pelo service. Só
`titulo` e `concluida` podem ser atualizados. A identidade do usuário deve vir
de autenticação confiável em uma API; os usuários 1 e 2 aqui são fictícios.
Ausência comum não é erro de infraestrutura. O service converte `null`/`false`
em 404 quando o caso de uso exige uma tarefa existente.

O teste compara memória e SQLite com relógio injetado, evitando diferenças de
milissegundos. Ambos devolvem os mesmos objetos e resultados. O `Map` devolve
cópias para impedir que o consumidor altere os dados sem chamar `atualizar`.
Esse contrato não obriga o `Map` a imitar todas as restrições de um motor SQL
para entradas inválidas enviadas diretamente fora do service.

## Exercício 2 — CRUD SQLite

[Implementação completa](src/repositories/sqlite.js) ·
[Demonstração](solucoes/exercicio-02.js) · `npm run ex2`

A implementação prepara os statements uma vez, na criação do repository:

1. **Buscar:** `SELECT ... WHERE id = ?`; o mapeador converte ausência em `null`.
2. **Inserir:** parâmetros nomeados recebem título, booleano convertido para
   0/1, proprietário e data. `lastInsertRowid` permite consultar a linha criada.
3. **Listar:** filtra `usuario_id = ?`, ordena por ID e mapeia cada linha.
4. **Atualizar parcialmente:** flags `temTitulo` e `temConcluida` indicam quais
   campos foram fornecidos. `CASE` preserva os demais. O `WHERE` exige ID e
   proprietário na própria escrita. `false` não é confundido com campo ausente.
5. **Remover:** `DELETE ... WHERE id = ? AND usuario_id = ?`; `changes > 0`
   resulta no booleano do contrato.

O mapeador é centralizado: `usuario_id → usuarioId`, `criado_em → criadoEm` e
`concluida === 1 → booleano`. Todas as saídas que contêm tarefas passam por ele.
A remoção devolve booleano, portanto não há linha a mapear nesse método.

Inserir/atualizar e consultar o resultado ficam em transações curtas. O driver
faz rollback se a função da transação lançar erro. A busca usada após inserir
é uma função local, sem depender de `this`, permitindo desestruturar os métodos.

O SQL usa apenas valores vinculados. Nomes de tabelas/colunas são fixos; não
recebemos nomes arbitrários para montar SQL. Um título contendo aspas ou texto
semelhante a SQL permanece um valor, como os testes demonstram.

A demonstração cria uma tarefa, busca, lista, altera só a conclusão, altera só
o título, volta a conclusão para `false`, tenta remover como outro usuário e
finalmente remove como proprietário. A busca final devolve `null`.

Arquivos de apoio: [conexão](src/db.js), [esquema](src/schema.sql),
[service](src/service.js) e [composição](src/composicao.js).
Só a composição escolhe memória ou SQLite; o service é o mesmo nos dois casos.

## Exercício 3 — Erros de restrição

[Demonstração executável](solucoes/exercicio-03.js) · `npm run ex3`

| Falha provocada no banco | Tradução | Resposta pública ilustrativa |
| --- | --- | --- |
| Email `ada@example.test` repetido | `EMAIL_JA_CADASTRADO` | 409 |
| Título `ab`, menor que 3 caracteres | `DADOS_INVALIDOS` | 400 |
| Tarefa apontando para usuário 999 | `USUARIO_INEXISTENTE` | 400 |
| Consulta a tabela inexistente | Não traduzir para erro de negócio | 500 |

O esquema não exige título único. Por isso, para demonstrar `UNIQUE` sem inventar
uma regra nova, adicionamos um pequeno [repository de usuários](src/usuarios-repository.js)
que tenta inserir email duplicado. A tradução de `SQLITE_CONSTRAINT_UNIQUE` é
local a essa operação: seu único campo UNIQUE é o email. Não usamos a mesma
mensagem indiscriminadamente para qualquer consulta/tabela.

O [tradutor das operações de tarefas](src/erros.js) reconhece somente FK,
CHECK e NOT NULL esperados. Outros erros são relançados como vieram. As causas
originais ficam em `erro.cause`, permitindo diagnóstico interno. Para provocar
o CHECK no próprio banco, a demonstração chama o repository diretamente; pela
interface normal do service, o título curto já seria rejeitado antes.

A [função de resposta da borda](src/resposta-erro.js) registra o erro completo
com `requestId` e produz uma resposta pública controlada. Erros conhecidos
usam seu código/status; erros inesperados retornam 500 e `ERRO_INTERNO`, sem
SQL, stack ou causa no corpo público. O logger é injetável para testar sem
poluir a saída nem confundir informação pública com diagnóstico interno.

Não há servidor HTTP neste laboratório. A função retorna `{status, body}`;
um middleware Express usaria `res.status(status).json(body)`. Assim é possível
testar o contrato de resposta sem introduzir outras dependências. Não é apenas
um erro 500 simulado: o teste provoca um erro SQL real e também uma conexão
fechada dentro do repository para verificar esse caminho.

## Testes e persistência

`npm test` executa os mesmos cenários de contrato e service para memória e
SQLite, além das falhas de restrição, causa preservada, ausência de vazamento
de detalhes e recuperação após conflito. O teste de persistência usa dois
processos Node diferentes e um arquivo temporário, removido ao terminar.

Para demonstração persistente opcional:

```sh
npm run demo:sqlite
npm run listar:sqlite
```

O primeiro comando adiciona uma tarefa concluída em `dados/tarefas.db`; o
segundo abre outro processo e lista os dados. Cada execução de `demo:sqlite`
adiciona outra tarefa, sem apagar anteriores. `demo:memoria` começa vazio a
cada execução. A conexão é fechada em `finally`.

## Limites

Esta é a Lista 1. Migrações versionadas, migração 002 e controle otimista de
versão pertencem à Lista 2 e não foram incluídos. `CREATE TABLE IF NOT EXISTS`
é inicialização repetível, não migração. O SQLite é síncrono: os métodos `async`
padronizam o contrato, mas não tornam o driver não bloqueante.
