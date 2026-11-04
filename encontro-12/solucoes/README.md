# Resoluções — Encontro 12

Execute os comandos na pasta `encontro-12`. Cada demonstração cria e fecha seu
próprio banco em memória; não é necessário executar a anterior. O SQL e o
JavaScript estão separados quando uma consulta precisa ser vinculada a valores.

## Lista 1, exercício 1 — Leia as restrições

[Código completo](exercicio-01/index.js) · `npm run ex1`

O código contém 15 casos com SQL, valores e erro esperado. `assert.throws`
confirma que o comando realmente falhou pela restrição indicada; não basta
imprimir uma mensagem e assumir que o banco protegeu o dado.

| Caso inválido | Regra protegida |
| --- | --- |
| ID de usuário ou tarefa já existente | PRIMARY KEY, unicidade da identidade |
| Nome ou email nulo | NOT NULL em usuarios |
| Email de Ada repetido | UNIQUE em email |
| Título nulo | NOT NULL em titulo |
| Título vazio, só espaços, 2 ou 121 caracteres | CHECK entre 3 e 120 após trim |
| Concluída nula | NOT NULL em concluida |
| Concluída igual a 2 | CHECK que admite apenas 0 e 1 |
| Proprietário nulo | NOT NULL em usuario_id |
| Proprietário 999, inexistente | FOREIGN KEY |
| Data de criação explicitamente nula | NOT NULL em criado_em |

Cada inserção falha isoladamente; o banco continua com as quatro tarefas.
Os testes também comprovam casos válidos, preenchimento de defaults e cascata.
`DEFAULT` não rejeita uma inserção: fornece um valor quando a coluna é omitida.
`ON DELETE CASCADE` é uma política de remoção, não uma restrição de INSERT.
Para verificá-la, remova Ada e confira que só suas tarefas desapareceram.
FK ativa não é o que rejeita um proprietário **nulo**: nesse caso é `NOT NULL`.

## Lista 1, exercício 2 — Consultas de listagem

[SQL](exercicio-02/consulta.sql) · [JavaScript](exercicio-02/index.js) · `npm run ex2`

A consulta combina proprietário, estado pendente e busca parcial no título.
`ORDER BY titulo, id` torna o desempate determinístico. Para página 2 com 5
itens, `OFFSET = (2 - 1) * 5 = 5`. O driver vincula `usuarioId` e `%termo%`;
não há concatenação do valor na gramática SQL.

Com o complemento e busca `sql` para Ada, a primeira página contém `Estudar SQL`
e `SQL 01` a `SQL 04`. A segunda devolve IDs **9, 10, 11, 12 e 13**, títulos
`SQL 05 filtros` a `SQL 09 filtros`. `SQL 10 filtros` fica na terceira página.
As tarefas concluídas e as de outros proprietários não entram no resultado.

Os caracteres `%` e `_` do termo continuam sendo curingas de `LIKE`, mas não
viram instruções SQL. Uma busca estritamente literal desses caracteres exigiria
escape explícito e cláusula `ESCAPE`, uma decisão distinta de parametrização.

## Lista 1, exercício 3 — Agregação

[SQL](exercicio-03/consulta.sql) · [JavaScript](exercicio-03/index.js) · `npm run ex3`

Começamos por `usuarios` e usamos `LEFT JOIN` para preservar quem não possui
tarefas. `COUNT(t.id)` ignora o ID nulo da linha estendida; `COUNT(*)` contaria
essa linha e daria 1 incorretamente. O `CASE` produz 1 só para tarefas concluídas
e 0 inclusive para a linha sem tarefa.

| Usuário | Total | Concluídas |
| --- | ---: | ---: |
| Ada | 12 | 1 |
| Bruno | 2 | 0 |
| Carla | 0 | 0 |

Filtrar as tarefas no `WHERE` após o `LEFT JOIN` pode eliminar a linha sem
correspondência. Aqui não colocamos um filtro que descarte Carla.

## Lista 2, exercício 4 — Atualização segura

[SQL](exercicio-04/consulta.sql) · [JavaScript](exercicio-04/index.js) · `npm run ex4`

O `UPDATE` vincula título, ID e proprietário e exige **as duas condições** no
`WHERE`. O resultado `.changes` informa o efeito. Uma linha afetada gera a
resposta didática 200; zero gera a mesma resposta 404 para recurso inexistente
ou alheio. Não fazemos um SELECT adicional para revelar que a tarefa pertence
a outra pessoa. O módulo não é um servidor HTTP; retorna objetos que ilustram
esse contrato de resposta.

A demonstração tenta alterar a tarefa 1 como Bruno e tenta um ID inexistente:
as duas respostas são iguais e o banco não muda. Depois Ada altera o título.
Em uma API, a identidade de Ada precisa vir de autenticação confiável, não de
um campo `usuarioId` escolhido pelo cliente.

O SQLite pode contar uma linha correspondente mesmo quando recebe o mesmo
título já armazenado. Não interprete `.changes` como prova universal de que o
valor era diferente. Restrições inválidas continuam lançando erro, não 404.

## Lista 2, exercício 5 — Demonstração de injeção

[Código completo](exercicio-05/index.js) · `npm run ex5`

O exemplo vulnerável usa a entrada fictícia `1 OR 1=1`:

```sql
SELECT id, titulo FROM tarefas WHERE id = 1 OR 1=1
```

A condição se torna verdadeira para todas as linhas e devolve as quatro tarefas.
Na versão segura, a estrutura continua `WHERE id = ?`; o parâmetro recebe a
string inteira. Nenhum ID corresponde a essa string e o resultado é vazio.
Já o valor numérico 1 vinculado corretamente encontra uma tarefa.

A diferença é estrutural: aspas e operadores não passam a ser código. Não é
necessário tentar remover palavras perigosas da entrada. Parametrização também
não permite usar `?` como nome de coluna ou direção de ordenação: nesses casos,
mapeie opções para fragmentos previamente permitidos.

O código vulnerável só existe para comparação em banco local descartável,
sem rede e sem operações destrutivas. Não o copie para uma aplicação real.

## Lista 2, exercício 6 — Transação com histórico

[Esquema do histórico](exercicio-06/historico.sql) · [Código completo](exercicio-06/index.js) · `npm run ex6`

Criamos `historico` com FK para tarefa, campos obrigatórios e `CHECK` permitindo
somente `CONCLUIDA` e `TRANSFERIDA`. A função inicia a transação, conclui uma
tarefa pendente do proprietário e insere `CONCLUIDA`. Só então faz `COMMIT`.

O parâmetro didático `forcarErro` troca o evento por `EVENTO_INVALIDO`, que
viola o `CHECK` **depois** do UPDATE. O `catch` executa `ROLLBACK` e relança o
erro. A demonstração verifica os resultados:

| Momento | concluida da tarefa 1 | Linhas em historico |
| --- | ---: | ---: |
| Antes | 0 | 0 |
| Após INSERT inválido e ROLLBACK | 0 | 0 |
| Após tentativa válida e COMMIT | 1 | 1 |

A falha de uma instrução por CHECK não desfaz automaticamente a instrução
anterior da transação. É por isso que o rollback explícito importa.
Também conferimos `.changes === 1` antes do INSERT: tarefa alheia, inexistente
ou já concluída não pode gerar um evento falso. A condição `concluida = 0`
impede duplicar o histórico ao repetir a conclusão. Nesta solução, a repetição
é rejeitada; outra política de idempotência poderia tratar isso diferentemente.

O teste tenta novamente depois de uma falha para comprovar que a conexão não
ficou com transação aberta. A função é síncrona, usa uma conexão e não deve ser
chamada dentro de outra transação. Não há chamadas de rede dentro dela.

## Conferir tudo

```sh
npm test
```

A suíte verifica seeds, 15 violações de restrições, limites válidos, defaults,
cascata, página exata, desempate, isolamento por usuário, agregação com total
zero, escrita parametrizada, injeção, commit, rollback e nova tentativa.
