-- fix-schema-v6.sql
-- Adiciona coluna email em usuarios para aparecer em Configurações
-- Execute no Supabase → SQL Editor

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Preenche email dos usuários existentes buscando de auth.users
UPDATE usuarios u
SET email = a.email
FROM auth.users a
WHERE u.id = a.id
  AND u.email IS NULL;

-- Notifica PostgREST para recarregar o schema cache
NOTIFY pgrst, 'reload schema';
