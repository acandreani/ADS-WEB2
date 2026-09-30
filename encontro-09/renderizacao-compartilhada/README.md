# Encontro 9 — a mesma template no servidor e no cliente

Exemplo baseado no código da página numerada 2 do caderno 9. O projeto mantém
`tituloPagina`, `tarefas`, Express e EJS, mas coloca lado a lado três formas de
produzir a mesma lista:

1. **Servidor + EJS:** o servidor busca os dados, executa a template e envia
   HTML pronto.
2. **Cliente + EJS:** o navegador recebe uma casca, busca a API e a mesma
   template EJS e então produz o HTML.
3. **Servidor sem template:** uma função JavaScript concatena todas as tags,
   condicionais e itens, inclusive a função obrigatória de escaping.

O arquivo compartilhado pelas duas primeiras versões é
`src/views/tarefas/conteudo.ejs`. Não são duas cópias parecidas: é exatamente
o mesmo arquivo executado em ambientes diferentes.

## Executar

Requer Node.js 20 ou superior.

```bash
npm ci
npm start
```

Abra <http://localhost:3000/>.

## Roteiro de observação

Abra as ferramentas do navegador na aba **Network** e visite:

- <http://localhost:3000/servidor-template>
- <http://localhost:3000/cliente-template>
- <http://localhost:3000/sem-template>

Na versão cliente aparecem requisições adicionais para `/api/tarefas`, para a
template e para a biblioteca EJS. Depois use **Exibir código-fonte da página**:
na versão servidor os títulos já estão no documento original; na versão
cliente eles só aparecem no DOM depois que o JavaScript executa.

Compare `src/views/tarefas/conteudo.ejs` com
`src/renderizar-sem-template.js`. A segunda implementação precisa escrever à
mão a estrutura, o laço, a condição de lista vazia e `escaparHtml`. A tarefa
com uma tag `<script>` mostra que dados externos devem continuar sendo texto.

## Testes

```bash
npm test
```

Os testes verificam a diferença entre o primeiro HTML de SSR e CSR, o acesso à
template compartilhada, a API e o escaping nas versões com e sem EJS.

## Observação de arquitetura

Expor uma template pela rota `/templates/tarefas-conteudo.ejs` é uma decisão
didática. A aplicação não publica a pasta `views` inteira. Em projetos reais,
é comum empacotar a template ou usar uma solução própria para componentes no
cliente. A regra de negócio continua fora da view nas três versões.
