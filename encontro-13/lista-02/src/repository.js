import { conflito } from './erro.js';
export function mapear(r) {
  return r ? { id: r.id, titulo: r.titulo, concluida: r.concluida === 1,
    usuarioId: r.usuario_id, criadoEm: r.criado_em, prioridade: r.prioridade, versao: r.versao } : null;
}
export function criarSqlite(db) {
  const buscar = db.prepare('SELECT * FROM tarefas WHERE id=? AND usuario_id=?');
  const listar = db.prepare('SELECT * FROM tarefas WHERE usuario_id=? ORDER BY id');
  const inserir = db.prepare(`INSERT INTO tarefas(titulo,concluida,usuario_id,criado_em,prioridade)
    VALUES (@titulo,@concluida,@usuarioId,@criadoEm,@prioridade)`);
  const atualizar = db.prepare(`UPDATE tarefas SET
    titulo=CASE WHEN @temTitulo THEN @titulo ELSE titulo END,
    concluida=CASE WHEN @temConcluida THEN @concluida ELSE concluida END,
    prioridade=CASE WHEN @temPrioridade THEN @prioridade ELSE prioridade END,
    versao=versao+1
    WHERE id=@id AND usuario_id=@usuarioId AND versao=@versao`);
  const remover = db.prepare('DELETE FROM tarefas WHERE id=? AND usuario_id=? AND versao=?');
  const gravar = db.transaction(dados => {
    const r = inserir.run({ ...dados, concluida: Number(dados.concluida), criadoEm: new Date().toISOString() });
    return mapear(buscar.get(Number(r.lastInsertRowid), dados.usuarioId));
  });
  const alterar = db.transaction((id, usuarioId, versao, patch) => {
    const { changes } = atualizar.run({ id, usuarioId, versao,
      temTitulo: Number(Object.hasOwn(patch, 'titulo')), titulo: patch.titulo ?? null,
      temConcluida: Number(Object.hasOwn(patch, 'concluida')), concluida: Number(patch.concluida ?? false),
      temPrioridade: Number(Object.hasOwn(patch, 'prioridade')), prioridade: patch.prioridade ?? null });
    if (changes === 0) throw conflito();
    return mapear(buscar.get(id, usuarioId));
  });
  return {
    async listar(u) { return listar.all(u).map(mapear); },
    async buscar(id, u) { return mapear(buscar.get(id, u)); },
    async inserir(dados) { return gravar(dados); },
    async atualizar(id, u, v, patch) { return alterar(id, u, v, patch); },
    async remover(id, u, v) { if (!remover.run(id, u, v).changes) throw conflito(); return true; }
  };
}

export function criarMemoria() {
  const tarefas = new Map(); let proximo = 1;
  const copiar = t => t ? { ...t } : null;
  return {
    async listar(u) { return [...tarefas.values()].filter(t => t.usuarioId === u).map(copiar); },
    async buscar(id, u) { const t = tarefas.get(id); return t?.usuarioId === u ? copiar(t) : null; },
    async inserir(dados) {
      const t = { ...dados, id: proximo++, criadoEm: new Date().toISOString(), versao: 1 };
      tarefas.set(t.id, t); return copiar(t);
    },
    async atualizar(id, u, v, patch) {
      const t = tarefas.get(id);
      if (!t || t.usuarioId !== u || t.versao !== v) throw conflito();
      Object.assign(t, patch, { versao: v + 1 }); return copiar(t);
    },
    async remover(id, u, v) {
      const t = tarefas.get(id);
      if (!t || t.usuarioId !== u || t.versao !== v) throw conflito();
      return tarefas.delete(id);
    }
  };
}
