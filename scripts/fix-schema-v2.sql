-- Cole e execute no Supabase SQL Editor
-- https://supabase.com/dashboard/project/ihueonlyamcjqzfadlif/sql/new

-- Adiciona coluna de responsaveis em eventos (armazenada como JSON texto)
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS responsaveis TEXT DEFAULT '[]';

-- Adiciona coluna de nome do funcionário em escalas (para exibição rápida)
ALTER TABLE escalas ADD COLUMN IF NOT EXISTS funcionario TEXT;

-- Garante que checklist_execucoes tem campo itens (para modo local/JSON)
ALTER TABLE checklist_execucoes ADD COLUMN IF NOT EXISTS modelo_nome TEXT;
ALTER TABLE checklist_execucoes ADD COLUMN IF NOT EXISTS responsavel TEXT;
ALTER TABLE checklist_execucoes ADD COLUMN IF NOT EXISTS funcionario_id UUID REFERENCES usuarios(id);

-- Atualiza cache do schema (força Supabase a re-ler as colunas)
NOTIFY pgrst, 'reload schema';
