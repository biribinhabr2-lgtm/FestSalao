-- Cole este SQL no Supabase SQL Editor e clique em RUN
-- https://supabase.com/dashboard/project/ihueonlyamcjqzfadlif/sql/new

-- Corrige o trigger para não bloquear criação de usuário em caso de erro
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  BEGIN
    INSERT INTO usuarios (id, empresa_id, nome, cargo, setor, role)
    VALUES (
      new.id,
      NULLIF(new.raw_user_meta_data->>'empresa_id', '')::uuid,
      COALESCE(new.raw_user_meta_data->>'nome', new.email),
      COALESCE(new.raw_user_meta_data->>'cargo', 'Funcionário'),
      COALESCE(new.raw_user_meta_data->>'setor', 'Geral'),
      COALESCE(new.raw_user_meta_data->>'role', 'funcionario')
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: %', SQLERRM;
  END;
  RETURN new;
END;
$$;
