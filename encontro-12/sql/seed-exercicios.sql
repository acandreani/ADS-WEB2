-- Complemento opcional; aplicar UMA vez, depois de seed.sql.
-- Carla não tem tarefas. Ada terá 11 pendentes que contêm SQL.
INSERT INTO usuarios (id, nome, email) VALUES (3, 'Carla', 'carla@example.test');
INSERT INTO tarefas (id, titulo, concluida, usuario_id) VALUES
  (5, 'SQL 01 filtros', 0, 1),
  (6, 'SQL 02 filtros', 0, 1),
  (7, 'SQL 03 filtros', 0, 1),
  (8, 'SQL 04 filtros', 0, 1),
  (9, 'SQL 05 filtros', 0, 1),
  (10, 'SQL 06 filtros', 0, 1),
  (11, 'SQL 07 filtros', 0, 1),
  (12, 'SQL 08 filtros', 0, 1),
  (13, 'SQL 09 filtros', 0, 1),
  (14, 'SQL 10 filtros', 0, 1);
