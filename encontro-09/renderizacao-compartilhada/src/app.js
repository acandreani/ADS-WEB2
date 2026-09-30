import express from 'express';
import { renderFile } from 'ejs';
import { fileURLToPath } from 'node:url';
import { tarefasService as servicePadrao } from './tarefas-service.js';
import { criarViewModel } from './view-model.js';
import { renderizarSemTemplate } from './renderizar-sem-template.js';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const views = fileURLToPath(new URL('./views', import.meta.url));
const templateCompartilhada = fileURLToPath(
  new URL('./views/tarefas/conteudo.ejs', import.meta.url)
);
const ejsDoNavegador = fileURLToPath(
  new URL('../node_modules/ejs/ejs.min.js', import.meta.url)
);

export function criarApp({ tarefasService = servicePadrao } = {}) {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', views);
  app.use(express.static(`${raiz}/public`));

  app.get('/', (req, res) => res.render('inicio'));

  app.get('/api/tarefas', async (req, res, next) => {
    try {
      return res.json(await tarefasService.listar());
    } catch (erro) {
      return next(erro);
    }
  });

  // Permite que o navegador execute EJS. Em produção, normalmente um bundle
  // entregaria essa biblioteca; aqui a rota explícita deixa a aula observável.
  app.get('/vendor/ejs.min.js', (req, res) => res.sendFile(ejsDoNavegador));

  // Exposição intencional de UMA template didática. Não sirva a pasta views.
  app.get('/templates/tarefas-conteudo.ejs', (req, res) => {
    return res.type('text/plain').sendFile(templateCompartilhada);
  });

  app.get('/servidor-template', async (req, res, next) => {
    try {
      const dados = await criarViewModel(tarefasService, 'servidor');
      const conteudo = await renderFile(templateCompartilhada, dados);
      return res.render('pagina', {
        tituloDocumento: `${dados.tituloPagina} — servidor + EJS`,
        modo: 'servidor',
        paginaAtual: 'servidor',
        conteudo
      });
    } catch (erro) {
      return next(erro);
    }
  });

  app.get('/cliente-template', (req, res) => {
    return res.render('pagina', {
      tituloDocumento: 'Minhas tarefas — cliente + EJS',
      modo: 'cliente',
      paginaAtual: 'cliente',
      conteudo: '<p class="carregando" role="status">Buscando dados e template…</p>'
    });
  });

  app.get('/sem-template', async (req, res, next) => {
    try {
      const dados = await criarViewModel(tarefasService, 'manual');
      return res.type('html').send(renderizarSemTemplate(dados));
    } catch (erro) {
      return next(erro);
    }
  });

  app.use((req, res) => res.status(404).type('text').send('Página não encontrada'));
  app.use((erro, req, res, next) => {
    console.error(erro);
    return res.status(500).type('text').send('Não foi possível montar a página');
  });

  return app;
}
