-- Prática guiada: exatamente dois usuários e quatro tarefas.
INSERT INTO usuarios (id, nome, email) VALUES
  (1, 'Ada', 'ada@example.test'),
  (2, 'Bruno', 'bruno@example.test');
INSERT INTO tarefas (id, titulo, concluida, usuario_id) VALUES
  (1, 'Estudar SQL', 0, 1),
  (2, 'Revisar restricoes', 1, 1),
  (3, 'Preparar seminario', 0, 2),
  (4, 'Testar transacao', 0, 2);
