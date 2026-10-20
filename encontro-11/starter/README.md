# Encontro 11 — Starter: catálogo e categorias remotas

Projeto independente para as duas listas do caderno 11. Após instalar as
dependências, tudo funciona localmente, sem API pública. Requer Node.js 20+.
Os cadernos do aluno e do professor já fornecem os textos e os enunciados.

## Executar

Entre nesta pasta e instale:

```bash
cd encontro-11/starter
npm ci
```

No primeiro terminal, execute o serviço de categorias:

```bash
npm run simulador
```

No segundo terminal, dentro da mesma pasta, execute o catálogo:

```bash
npm start
```

Teste as três rotas iniciais:

```bash
curl -i http://localhost:4000/categorias/1
curl -i http://localhost:3000/api/produtos
curl -i http://localhost:3000/api/produtos/1
```

A última retorna **501 EXERCICIO_PENDENTE** até você implementar o client.
Isso é intencional: o starter fornece os processos e os dados, não a solução.

## Simular falhas

Encerre o simulador com Ctrl+C e reinicie no modo desejado (Bash):

```bash
MODO=lento npm run simulador
MODO=erro npm run simulador
MODO=invalido npm run simulador
```

Execute apenas um desses comandos por vez. Em PowerShell, use por exemplo
`$env:MODO="lento"; npm run simulador`; para voltar, defina `normal`.

| Cenário | Como provocar |
| --- | --- |
| Sucesso | `MODO=normal`; retorna `{codigo,descricao}` |
| Demora | `MODO=lento`; espera dois segundos |
| Erro HTTP | `MODO=erro`; retorna 500 |
| JSON inválido | `MODO=invalido`; retorna 200 e JSON truncado |
| Estrutura inválida | `MODO=estrutura`; retorna campos inválidos |
| Tipo inesperado | `MODO=tipo`; retorna HTML |
| Ausência legítima | modo normal, `/categorias/999` |
| Conexão recusada | pare o simulador e consulte um produto após implementar o client |

`GET http://localhost:4000/metricas` mostra quantas chamadas chegaram à rota de
categorias. O contador reinicia com o processo; ler métricas não o incrementa.

## Onde trabalhar

- Lista 1, exercício 1: elabore o mapa de falhas, respostas e fallback.
- Exercício 2: complete `src/clients/categorias-client.js`; converta
  `{codigo,descricao}` em `{id,nome}` e retorne `null` para 404.
- Exercício 3: aplique timeout de 300 ms e traduza as falhas em erros com
  `status` 504 (timeout) ou 502 (outras falhas remotas). Preserve a causa no
  erro interno; o middleware já a registra com um identificador da requisição.
- Lista 2: adicione cache com TTL e relógio injetável, compartilhe chamadas em
  andamento e defina fallback conforme a função da categoria.

A configuração já passa `CATEGORIAS_URL` (padrão `http://localhost:4000`) e
`CATEGORIAS_TIMEOUT_MS` (padrão 300) ao client. O timeout só passa a ter efeito
quando o exercício 3 for implementado. O catálogo não conhece o formato remoto.

O produto 3 referencia a categoria 999, permitindo discutir ausência legítima.
Não confunda 404 com indisponibilidade e não autorize operações por fallback
quando a categoria determinar permissões.

## Verificação do starter

```bash
npm test
```

Os testes conferem o simulador e o ponto de partida do catálogo. Atualize a
expectativa de 501 ao implementar o client e acrescente os testes das listas.
