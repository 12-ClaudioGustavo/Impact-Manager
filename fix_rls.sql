-- ==============================================================================
-- CORREÇÃO DE PERMISSÕES (RLS) - Execute este script no SQL Editor do Supabase
-- ==============================================================================

-- 1. Políticas para a tabela 'organizations'
-- O erro que você viu acontece porque não havia permissão para criar organizações.

-- Permitir que qualquer usuário logado crie uma organização
CREATE POLICY "Permitir inserção de organizações" ON organizations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir que usuários vejam a organização à qual pertencem
CREATE POLICY "Permitir visualizar própria organização" ON organizations
FOR SELECT
USING (
  id IN (
    SELECT organization_id FROM users WHERE auth_id = auth.uid()
  )
);

-- 2. Políticas para a tabela 'users'
-- Necessário para criar o perfil de admin logo após criar a organização.

-- Permitir que o usuário crie seu próprio perfil vinculado ao seu ID de autenticação
CREATE POLICY "Permitir inserir próprio perfil" ON users
FOR INSERT
TO authenticated
WITH CHECK (auth_id = auth.uid());

-- Atualizar a política de visualização para garantir que o usuário veja a si mesmo
-- (Remove a anterior se existir para evitar conflitos ou bloqueios)
DROP POLICY IF EXISTS users_org_isolation ON users;

CREATE POLICY "Permitir visualizar usuários da mesma organização" ON users
FOR SELECT
USING (
  auth_id = auth.uid() OR 
  organization_id IN (
    SELECT organization_id FROM users WHERE auth_id = auth.uid()
  )
);
