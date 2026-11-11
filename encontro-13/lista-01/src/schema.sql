CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tarefas (
  id INTEGER PRIMARY KEY,
  titulo TEXT NOT NULL CHECK (length(trim(titulo)) BETWEEN 3 AND 120),
  concluida INTEGER NOT NULL DEFAULT 0 CHECK (concluida IN (0, 1)),
  usuario_id INTEGER NOT NULL,
  criado_em TEXT NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Usuários fictícios fixos; reabrir o banco não remove nem recria tarefas.
INSERT INTO usuarios (id, nome, email) VALUES (1, 'Ada', 'ada@example.test')
ON CONFLICT(id) DO NOTHING;
INSERT INTO usuarios (id, nome, email) VALUES (2, 'Bruno', 'bruno@example.test')
ON CONFLICT(id) DO NOTHING;
