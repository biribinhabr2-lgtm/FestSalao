-- fix-schema-v5.sql
-- Adiciona colunas faltantes em checklist_modelos e checklist_execucoes
-- Execute no Supabase → SQL Editor

-- Colunas de checklist_modelos
ALTER TABLE checklist_modelos
  ADD COLUMN IF NOT EXISTS itens        TEXT    DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS setor        TEXT    DEFAULT 'Geral',
  ADD COLUMN IF NOT EXISTS recorrencia  TEXT    DEFAULT 'Diária',
  ADD COLUMN IF NOT EXISTS empresa_id   UUID,
  ADD COLUMN IF NOT EXISTS criado_por   UUID,
  ADD COLUMN IF NOT EXISTS criado_em    TIMESTAMPTZ DEFAULT NOW();

-- Colunas de checklist_execucoes
ALTER TABLE checklist_execucoes
  ADD COLUMN IF NOT EXISTS modelo_id    UUID,
  ADD COLUMN IF NOT EXISTS modelo_nome  TEXT,
  ADD COLUMN IF NOT EXISTS itens        TEXT    DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS responsavel  TEXT,
  ADD COLUMN IF NOT EXISTS funcionario_id UUID,
  ADD COLUMN IF NOT EXISTS status       TEXT    DEFAULT 'Pendente',
  ADD COLUMN IF NOT EXISTS data         DATE    DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS empresa_id   UUID,
  ADD COLUMN IF NOT EXISTS criado_por   UUID,
  ADD COLUMN IF NOT EXISTS criado_em    TIMESTAMPTZ DEFAULT NOW();

-- Notifica PostgREST para recarregar o schema cache
NOTIFY pgrst, 'reload schema';
