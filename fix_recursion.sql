-- ==============================================================================
-- CORREÇÃO DE RECURSÃO INFINITA (RLS) - Execute este script no SQL Editor do Supabase
-- ==============================================================================

-- 1. Criar função segura para obter organização do usuário
-- SECURITY DEFINER permite que a função leia a tabela users sem acionar as políticas do usuário que chama
CREATE OR REPLACE FUNCTION get_auth_user_organization_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$;

-- 2. Corrigir políticas da tabela 'users' (Onde ocorre o erro de recursão)
DROP POLICY IF EXISTS users_org_isolation ON users;
DROP POLICY IF EXISTS "Permitir visualizar usuários da mesma organização" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view members of same organization" ON users;

-- Política simples: Usuário vê a si mesmo
CREATE POLICY "Users can view own profile" ON users
FOR SELECT
USING (
  auth_id = auth.uid()
);

-- Política composta: Usuário vê outros da mesma organização (usando a função segura)
CREATE POLICY "Users can view members of same organization" ON users
FOR SELECT
USING (
  organization_id = get_auth_user_organization_id()
);

-- 3. Atualizar políticas dependentes nas outras tabelas
-- As políticas antigas também causavam recursão indireta ao fazer SELECT na tabela users

-- Members
DROP POLICY IF EXISTS members_org_isolation ON members;
CREATE POLICY members_org_isolation ON members
USING (organization_id = get_auth_user_organization_id());

-- Donations
DROP POLICY IF EXISTS donations_org_isolation ON donations;
CREATE POLICY donations_org_isolation ON donations
USING (organization_id = get_auth_user_organization_id());

-- Events
DROP POLICY IF EXISTS events_org_isolation ON events;
CREATE POLICY events_org_isolation ON events
USING (organization_id = get_auth_user_organization_id());

-- Projects
DROP POLICY IF EXISTS projects_org_isolation ON projects;
CREATE POLICY projects_org_isolation ON projects
USING (organization_id = get_auth_user_organization_id());

-- Volunteers
DROP POLICY IF EXISTS volunteers_org_isolation ON volunteers;
CREATE POLICY volunteers_org_isolation ON volunteers
USING (organization_id = get_auth_user_organization_id());

-- Financial Transactions
DROP POLICY IF EXISTS financial_org_isolation ON financial_transactions;
CREATE POLICY financial_org_isolation ON financial_transactions
USING (organization_id = get_auth_user_organization_id());

-- Organizations (Visualização)
DROP POLICY IF EXISTS "Permitir visualizar própria organização" ON organizations;
CREATE POLICY "Permitir visualizar própria organização" ON organizations
FOR SELECT
USING (id = get_auth_user_organization_id());
