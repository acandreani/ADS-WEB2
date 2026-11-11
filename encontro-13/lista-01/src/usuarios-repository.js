import { ErroAplicacao } from './erros.js';

// Operação auxiliar do exercício 3: o esquema tem UNIQUE no email, não no título.
export function criarUsuariosSqlite(db) {
  const inserir = db.prepare('INSERT INTO usuarios (nome, email) VALUES (?, ?)');
  const buscar = db.prepare('SELECT id, nome, email FROM usuarios WHERE id = ?');
  return {
    async inserir({ nome, email }) {
      try {
        const resultado = inserir.run(nome, email);
        return buscar.get(Number(resultado.lastInsertRowid));
      } catch (erro) {
        // Nesta instrução específica, o único UNIQUE possível é usuarios.email.
        // Não aplicar esta tradução indiscriminadamente a qualquer tabela/consulta.
        if (erro.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          throw new ErroAplicacao('EMAIL_JA_CADASTRADO', 'Email ja cadastrado', 409, { cause: erro });
        }
        throw erro;
      }
    }
  };
}
