-- Cria a tabela para guardar perfis de utilizador e preferências
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at timestamptz,
  full_name text,
  avatar_url text,
  preferred_language varchar(10) DEFAULT 'pt-BR',
  subscription_tier text DEFAULT 'free'
);

-- Comentários para clarificação
COMMENT ON TABLE public.profiles IS 'Tabela para informações de perfil e preferências do utilizador.';
COMMENT ON COLUMN public.profiles.id IS 'Chave estrangeira para auth.users.id';
COMMENT ON COLUMN public.profiles.subscription_tier IS 'Nível da subscrição: free, pro, organization';

-- Ativa a Row Level Security (RLS) para a tabela
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Utilizadores podem ver e editar o seu próprio perfil.
CREATE POLICY "User can view and update their own profile."
ON public.profiles
FOR ALL
USING (auth.uid() = id);

-- Função para criar automaticamente um perfil quando um novo utilizador se regista
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que chama a função acima após a criação de um novo utilizador
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
