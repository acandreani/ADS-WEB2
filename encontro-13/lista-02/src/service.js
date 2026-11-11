import { ErroAplicacao } from './erro.js';
const invalido = mensagem => new ErroAplicacao(400, 'DADOS_INVALIDOS', mensagem);
export function inteiro(n) { if (!Number.isSafeInteger(n) || n < 1) throw invalido('Informe inteiro positivo'); return n; }
function campos(dados, parcial = false) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) throw invalido('Informe objeto JSON');
  const permitidos = parcial ? ['titulo', 'concluida', 'prioridade', 'versao'] : ['titulo', 'concluida', 'prioridade'];
  if (Object.keys(dados).some(k => !permitidos.includes(k))) throw invalido('Campo nao permitido');
  const out = {};
  if (!parcial || Object.hasOwn(dados, 'titulo')) {
    if (typeof dados.titulo !== 'string') throw invalido('Titulo obrigatorio');
    const titulo = dados.titulo.trim();
    if (Array.from(titulo).length < 3 || Array.from(titulo).length > 120 || titulo.includes('\0')) throw invalido('Titulo invalido');
    out.titulo = titulo;
  }
  if (Object.hasOwn(dados, 'concluida')) {
    if (typeof dados.concluida !== 'boolean') throw invalido('concluida deve ser booleano');
    out.concluida = dados.concluida;
  } else if (!parcial) out.concluida = false;
  if (Object.hasOwn(dados, 'prioridade')) {
    if (!['baixa', 'normal', 'alta'].includes(dados.prioridade)) throw invalido('Prioridade invalida');
    out.prioridade = dados.prioridade;
  } else if (!parcial) out.prioridade = 'normal';
  if (parcial && !Object.keys(out).length) throw invalido('Informe ao menos um campo para atualizar');
  return out;
}
export function criarService(repo) {
  return {
    listar(u) { return repo.listar(inteiro(u)); },
    async buscar(u, id) {
      const t = await repo.buscar(inteiro(id), inteiro(u));
      if (!t) throw new ErroAplicacao(404, 'NAO_ENCONTRADA', 'Tarefa nao encontrada');
      return t;
    },
    criar(u, dados) { return repo.inserir({ ...campos(dados), usuarioId: inteiro(u) }); },
    atualizar(u, id, dados) {
      const patch = campos(dados, true);
      return repo.atualizar(inteiro(id), inteiro(u), inteiro(dados.versao), patch);
    },
    remover(u, id, versao) { return repo.remover(inteiro(id), inteiro(u), inteiro(versao)); }
  };
}
