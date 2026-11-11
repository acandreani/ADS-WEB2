import { traduzirErroSqlite } from '../erros.js';

export function mapearTarefa(linha) {
  if (!linha) return null;
  return {
    id: linha.id,
    titulo: linha.titulo,
    concluida: linha.concluida === 1,
    usuarioId: linha.usuario_id,
    criadoEm: linha.criado_em
  };
}

export function criarTarefasSqlite(db, { agora = () => new Date().toISOString() } = {}) {
  // Preparados uma única vez. Não há dados interpolados na estrutura SQL.
  const listar = db.prepare(`SELECT id, titulo, concluida, usuario_id, criado_em
    FROM tarefas WHERE usuario_id = ? ORDER BY id`);
  const buscar = db.prepare(`SELECT id, titulo, concluida, usuario_id, criado_em
    FROM tarefas WHERE id = ?`);
  const inserir = db.prepare(`INSERT INTO tarefas (titulo, concluida, usuario_id, criado_em)
    VALUES (@titulo, @concluida, @usuarioId, @criadoEm)`);
  const atualizar = db.prepare(`UPDATE tarefas SET
    titulo = CASE WHEN @temTitulo = 1 THEN @titulo ELSE titulo END,
    concluida = CASE WHEN @temConcluida = 1 THEN @concluida ELSE concluida END
    WHERE id = @id AND usuario_id = @usuarioId`);
  const remover = db.prepare('DELETE FROM tarefas WHERE id = ? AND usuario_id = ?');
  const buscarPorId = id => mapearTarefa(buscar.get(id));

  const inserirEConsultar = db.transaction(dados => {
    const resultado = inserir.run({ ...dados, concluida: dados.concluida ? 1 : 0, criadoEm: agora() });
    // Não depende de `this`: funciona mesmo com método desestruturado.
    return buscarPorId(Number(resultado.lastInsertRowid));
  });
  const atualizarEConsultar = db.transaction((id, usuarioId, alteracoes) => {
    const resultado = atualizar.run({
      id, usuarioId,
      temTitulo: Number(Object.hasOwn(alteracoes, 'titulo')),
      titulo: alteracoes.titulo ?? null,
      temConcluida: Number(Object.hasOwn(alteracoes, 'concluida')),
      concluida: alteracoes.concluida ? 1 : 0
    });
    return resultado.changes === 0 ? null : buscarPorId(id);
  });

  const executar = operacao => {
    try { return operacao(); } catch (erro) { throw traduzirErroSqlite(erro); }
  };
  return {
    async listarPorUsuario(usuarioId) { return listar.all(usuarioId).map(mapearTarefa); },
    async buscarPorId(id) { return buscarPorId(id); },
    async inserir(dados) { return executar(() => inserirEConsultar(dados)); },
    async atualizar(id, usuarioId, alteracoes) {
      return executar(() => atualizarEConsultar(id, usuarioId, alteracoes));
    },
    async remover(id, usuarioId) { return executar(() => remover.run(id, usuarioId).changes > 0); }
  };
}
