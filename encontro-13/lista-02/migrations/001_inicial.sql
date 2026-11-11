CREATE TABLE usuarios (id INTEGER PRIMARY KEY, nome TEXT NOT NULL);
INSERT INTO usuarios VALUES (1, 'Ada'), (2, 'Bruno');
CREATE TABLE tarefas (
  id INTEGER PRIMARY KEY,
  titulo TEXT NOT NULL CHECK(length(trim(titulo)) BETWEEN 3 AND 120),
  concluida INTEGER NOT NULL DEFAULT 0 CHECK(concluida IN (0,1)),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  criado_em TEXT NOT NULL
);
