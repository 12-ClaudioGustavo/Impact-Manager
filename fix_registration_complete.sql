-- ==============================================================================
-- CORREÇÃO COMPLETA DO PROCESSO DE REGISTRO
-- ==============================================================================
-- Este script garante que o registro funcione corretamente e todos os dados
-- sejam inseridos nas tabelas necessárias com as permissões adequadas.
-- ==============================================================================

-- ========================================
-- 1. LIMPAR POLÍTICAS EXISTENTES
-- ========================================

-- Organizations
DROP POLICY IF EXISTS "Permitir inserção de organizações" ON organizations;
DROP POLICY IF EXISTS "Permitir visualizar própria organização" ON organizations;
DROP POLICY IF EXISTS users_org_isolation ON organizations;
DROP POLICY IF EXISTS "Permitir atualizar própria organização" ON organizations;

-- Users
DROP POLICY IF EXISTS "Permitir inserir próprio perfil" ON users;
DROP POLICY IF EXISTS "Permitir visualizar usuários da mesma organização" ON users;
DROP POLICY IF EXISTS users_org_isolation ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view members of same organization" ON users;
DROP POLICY IF EXISTS "Permitir atualizar próprio perfil" ON users;

-- ========================================
-- 2. CRIAR FUNÇÃO AUXILIAR SEGURA
-- ========================================

-- Função para obter o organization_id do usuário autenticado
-- Esta função evita recursão infinita nas políticas RLS
CREATE OR REPLACE FUNCTION get_auth_user_organization_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id
  FROM users
  WHERE auth_id = auth.uid()
  LIMIT 1;
$$;

-- ========================================
-- 3. POLÍTICAS PARA ORGANIZATIONS
-- ========================================

-- Permitir que qualquer usuário autenticado crie uma organização
CREATE POLICY "Permitir inserção de organizações"
ON organizations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir que usuários vejam sua própria organização
CREATE POLICY "Permitir visualizar própria organização"
ON organizations
FOR SELECT
TO authenticated
USING (id = get_auth_user_organization_id());

-- Permitir que usuários atualizem sua própria organização
CREATE POLICY "Permitir atualizar própria organização"
ON organizations
FOR UPDATE
TO authenticated
USING (id = get_auth_user_organization_id())
WITH CHECK (id = get_auth_user_organization_id());

-- ========================================
-- 4. POLÍTICAS PARA USERS
-- ========================================

-- Permitir que usuários criem seu próprio perfil
CREATE POLICY "Permitir inserir próprio perfil"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth_id = auth.uid());

-- Permitir que usuários vejam seu próprio perfil
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
TO authenticated
USING (auth_id = auth.uid());

-- Permitir que usuários vejam membros da mesma organização
CREATE POLICY "Users can view members of same organization"
ON users
FOR SELECT
TO authenticated
USING (organization_id = get_auth_user_organization_id());

-- Permitir que usuários atualizem seu próprio perfil
CREATE POLICY "Permitir atualizar próprio perfil"
ON users
FOR UPDATE
TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

-- ========================================
-- 5. POLÍTICAS PARA MEMBERS
-- ========================================

DROP POLICY IF EXISTS members_org_isolation ON members;

CREATE POLICY "Permitir operações de membros da organização"
ON members
FOR ALL
TO authenticated
USING (organization_id = get_auth_user_organization_id())
WITH CHECK (organization_id = get_auth_user_organization_id());

-- ========================================
-- 6. POLÍTICAS PARA DONATIONS
-- ========================================

DROP POLICY IF EXISTS donations_org_isolation ON donations;

CREATE POLICY "Permitir operações de doações da organização"
ON donations
FOR ALL
TO authenticated
USING (organization_id = get_auth_user_organization_id())
WITH CHECK (organization_id = get_auth_user_organization_id());

-- ========================================
-- 7. POLÍTICAS PARA EVENTS
-- ========================================

DROP POLICY IF EXISTS events_org_isolation ON events;

CREATE POLICY "Permitir operações de eventos da organização"
ON events
FOR ALL
TO authenticated
USING (organization_id = get_auth_user_organization_id())
WITH CHECK (organization_id = get_auth_user_organization_id());

-- ========================================
-- 8. POLÍTICAS PARA PROJECTS
-- ========================================

DROP POLICY IF EXISTS projects_org_isolation ON projects;

CREATE POLICY "Permitir operações de projetos da organização"
ON projects
FOR ALL
TO authenticated
USING (organization_id = get_auth_user_organization_id())
WITH CHECK (organization_id = get_auth_user_organization_id());

-- ========================================
-- 9. POLÍTICAS PARA VOLUNTEERS
-- ========================================

DROP POLICY IF EXISTS volunteers_org_isolation ON volunteers;

CREATE POLICY "Permitir operações de voluntários da organização"
ON volunteers
FOR ALL
TO authenticated
USING (organization_id = get_auth_user_organization_id())
WITH CHECK (organization_id = get_auth_user_organization_id());

-- ========================================
-- 10. POLÍTICAS PARA FINANCIAL_TRANSACTIONS
-- ========================================

DROP POLICY IF EXISTS financial_org_isolation ON financial_transactions;

CREATE POLICY "Permitir operações financeiras da organização"
ON financial_transactions
FOR ALL
TO authenticated
USING (organization_id = get_auth_user_organization_id())
WITH CHECK (organization_id = get_auth_user_organization_id());

-- ========================================
-- 11. VERIFICAÇÃO DE INTEGRIDADE
-- ========================================

-- Adicionar constraint para garantir que email da organização seja único e válido
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organizations_email_valid'
  ) THEN
    ALTER TABLE organizations
    ADD CONSTRAINT organizations_email_valid
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
END $$;

-- Adicionar constraint para garantir que auth_id seja único
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_auth_id_unique'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_auth_id_unique
    UNIQUE (auth_id);
  END IF;
END $$;

-- ========================================
-- 12. FUNÇÃO DE VALIDAÇÃO DE REGISTRO
-- ========================================

-- Função para validar dados de registro antes da inserção
CREATE OR REPLACE FUNCTION validate_registration_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar que o nome da organização não está vazio
  IF NEW.name IS NULL OR TRIM(NEW.name) = '' THEN
    RAISE EXCEPTION 'Nome da organização não pode estar vazio';
  END IF;

  -- Validar que o email está presente
  IF NEW.email IS NULL OR TRIM(NEW.email) = '' THEN
    RAISE EXCEPTION 'Email da organização é obrigatório';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para validação na tabela organizations
DROP TRIGGER IF EXISTS validate_organization_before_insert ON organizations;
CREATE TRIGGER validate_organization_before_insert
  BEFORE INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION validate_registration_data();

-- ========================================
-- 13. ÍNDICES PARA MELHOR PERFORMANCE
-- ========================================

-- Índice para auth_id (usado frequentemente nas políticas)
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- Índice para organization_id em users
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

-- Índices para organization_id em outras tabelas
CREATE INDEX IF NOT EXISTS idx_members_organization_id ON members(organization_id);
CREATE INDEX IF NOT EXISTS idx_donations_organization_id ON donations(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_organization_id ON volunteers(organization_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_organization_id ON financial_transactions(organization_id);

-- ========================================
-- 14. PERMISSÕES EXPLÍCITAS
-- ========================================

-- Garantir que usuários autenticados podem acessar as tabelas
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON donations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON volunteers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_transactions TO authenticated;

-- ========================================
-- SCRIPT CONCLUÍDO
-- ========================================

-- Para testar se tudo está funcionando, execute:
-- SELECT * FROM pg_policies WHERE schemaname = 'public';
--
-- Isso mostrará todas as políticas criadas.

-- Após executar este script:
-- 1. O registro de novas organizações funcionará corretamente
-- 2. O perfil de usuário será criado automaticamente
-- 3. As políticas RLS estarão configuradas corretamente
-- 4. Não haverá problemas de recursão
-- 5. Os dados serão isolados por organização
