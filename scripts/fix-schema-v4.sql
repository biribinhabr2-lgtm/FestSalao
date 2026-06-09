-- fix-schema-v4.sql
-- Adiciona colunas que faltam em checklist_modelos e checklist_execucoes
-- Execute no Supabase → SQL Editor

ALTER TABLE checklist_modelos
  ADD COLUMN IF NOT EXISTS empresa_id UUID,
  ADD COLUMN IF NOT EXISTS criado_por UUID,
  ADD COLUMN IF NOT EXISTS criado_em  TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE checklist_execucoes
  ADD COLUMN IF NOT EXISTS empresa_id UUID,
  ADD COLUMN IF NOT EXISTS criado_por UUID,
  ADD COLUMN IF NOT EXISTS criado_em  TIMESTAMPTZ DEFAULT NOW();

-- Garante que as tabelas principais também tenham essas colunas
ALTER TABLE eventos
  ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE avisos
  ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE escalas
  ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ DEFAULT NOW();

-- Notifica PostgREST para recarregar o schema cache
NOTIFY pgrst, 'reload schema';
