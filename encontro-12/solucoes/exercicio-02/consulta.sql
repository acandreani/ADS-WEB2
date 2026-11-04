SELECT id, titulo, concluida, criado_em
FROM tarefas
WHERE usuario_id = ? AND concluida = 0
  AND lower(titulo) LIKE lower(?)
ORDER BY titulo ASC, id ASC
LIMIT 5 OFFSET 5;
