ALTER TABLE tarefas ADD COLUMN prioridade TEXT NOT NULL DEFAULT 'normal'
CHECK(prioridade IN ('baixa', 'normal', 'alta'));
