SELECT u.id, u.nome, COUNT(t.id) AS total,
       SUM(CASE WHEN t.concluida = 1 THEN 1 ELSE 0 END) AS concluidas
FROM usuarios u
LEFT JOIN tarefas t ON t.usuario_id = u.id
GROUP BY u.id, u.nome
ORDER BY u.nome, u.id;
