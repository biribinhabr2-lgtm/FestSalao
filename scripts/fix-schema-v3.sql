-- Execute no Supabase SQL Editor
-- https://supabase.com/dashboard/project/ihueonlyamcjqzfadlif/sql/new

-- Colunas faltando em avisos
ALTER TABLE avisos ADD COLUMN IF NOT EXISTS autor TEXT;
ALTER TABLE avisos ADD COLUMN IF NOT EXISTS lido  BOOLEAN DEFAULT FALSE;

-- Recarrega schema cache
NOTIFY pgrst, 'reload schema';
