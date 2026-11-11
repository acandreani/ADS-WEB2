import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { abrirBanco, migrar } from './db.js';
import { criarSqlite, criarMemoria } from './repository.js';
import { criarService } from './service.js';
import { ErroAplicacao } from './erro.js';

async function corpo(req) {
  const partes = []; let tamanho = 0;
  for await (const parte of req) {
    tamanho += parte.length;
    if (tamanho > 16384) throw new ErroAplicacao(413, 'CORPO_GRANDE', 'Limite de 16 KiB');
    partes.push(parte);
  }
  try { return JSON.parse(Buffer.concat(partes).toString()); }
  catch { throw new ErroAplicacao(400, 'JSON_INVALIDO', 'JSON invalido'); }
}
export function criarAplicacao({ caminho = ':memory:', armazenamento = 'sqlite', registrar = console.error } = {}) {
  let db, repo;
  // Única decisão de composição; service e handler não conhecem o armazenamento.
  if (armazenamento === 'memoria') repo = criarMemoria();
  else if (armazenamento === 'sqlite') {
    db = abrirBanco(caminho);
    try { migrar(db); repo = criarSqlite(db); } catch (e) { db.close(); throw e; }
  } else throw new Error('ARMAZENAMENTO deve ser sqlite ou memoria');
  const service = criarService(repo);
  const server = createServer(async (req, res) => {
    const requestId = randomUUID();
    const responder = (status, objeto) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'X-Request-Id': requestId });
      res.end(objeto === undefined ? undefined : JSON.stringify(objeto));
    };
    try {
      // Identidade fictícia para laboratório local. NÃO é autenticação de produção.
      const raw = req.headers['x-usuario-id'] ?? '1';
      if (!['1', '2'].includes(raw)) throw new ErroAplicacao(400, 'USUARIO_INVALIDO', 'Use usuario ficticio 1 ou 2');
      const u = Number(raw);
      const url = new URL(req.url, 'http://localhost');
      const match = /^\/tarefas\/([1-9]\d*)$/.exec(url.pathname);
      if (url.pathname === '/tarefas' && req.method === 'GET') responder(200, await service.listar(u));
      else if (url.pathname === '/tarefas' && req.method === 'POST') responder(201, await service.criar(u, await corpo(req)));
      else if (match && req.method === 'GET') responder(200, await service.buscar(u, Number(match[1])));
      else if (match && req.method === 'PATCH') responder(200, await service.atualizar(u, Number(match[1]), await corpo(req)));
      else if (match && req.method === 'DELETE') {
        await service.remover(u, Number(match[1]), Number(url.searchParams.get('versao')));
        responder(204);
      } else responder(404, { codigo: 'ROTA_NAO_ENCONTRADA' });
    } catch (erro) {
      registrar({ requestId, erro });
      responder(erro instanceof ErroAplicacao ? erro.status : 500,
        { codigo: erro instanceof ErroAplicacao ? erro.codigo : 'ERRO_INTERNO',
          mensagem: erro instanceof ErroAplicacao ? erro.message : 'Erro interno', requestId });
    }
  });
  return { server, fechar: () => { if (db?.open) db.close(); } };
}
