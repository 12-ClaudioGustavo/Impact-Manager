-- ==============================================================================
-- SCRIPT DE TESTE - VERIFICAÇÃO DO PROCESSO DE REGISTRO
-- ==============================================================================
-- Execute este script no SQL Editor do Supabase para verificar se tudo
-- está configurado corretamente para o processo de registro.
-- ==============================================================================

-- ========================================
-- 1. VERIFICAR POLÍTICAS RLS
-- ========================================

SELECT
  '✅ VERIFICAÇÃO DE POLÍTICAS RLS' as status;

SELECT
  tablename,
  policyname,
  cmd as operacao,
  CASE
    WHEN qual IS NOT NULL THEN '✅ Com condição'
    ELSE '⚠️ Sem condição'
  END as tem_condicao
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'users', 'members', 'donations', 'events', 'projects')
ORDER BY tablename, policyname;

-- ========================================
-- 2. VERIFICAR FUNÇÃO AUXILIAR
-- ========================================

SELECT
  '✅ VERIFICAÇÃO DA FUNÇÃO AUXILIAR' as status;

SELECT
  proname as nome_funcao,
  CASE
    WHEN prosecdef THEN '✅ SECURITY DEFINER'
    ELSE '⚠️ Sem SECURITY DEFINER'
  END as seguranca,
  CASE
    WHEN provolatile = 'i' THEN '✅ IMMUTABLE'
    WHEN provolatile = 's' THEN '✅ STABLE'
    ELSE '⚠️ VOLATILE'
  END as volatilidade
FROM pg_proc
WHERE proname = 'get_auth_user_organization_id';

-- ========================================
-- 3. VERIFICAR ÍNDICES
-- ========================================

SELECT
  '✅ VERIFICAÇÃO DE ÍNDICES' as status;

SELECT
  tablename as tabela,
  indexname as indice,
  '✅ Criado' as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ========================================
-- 4. VERIFICAR CONSTRAINTS
-- ========================================

SELECT
  '✅ VERIFICAÇÃO DE CONSTRAINTS' as status;

SELECT
  conrelid::regclass as tabela,
  conname as constraint_nome,
  CASE contype
    WHEN 'c' THEN '✅ CHECK'
    WHEN 'f' THEN '✅ FOREIGN KEY'
    WHEN 'p' THEN '✅ PRIMARY KEY'
    WHEN 'u' THEN '✅ UNIQUE'
    ELSE '⚠️ Outro tipo'
  END as tipo
FROM pg_constraint
WHERE conrelid::regclass::text IN ('organizations', 'users')
  AND contype IN ('c', 'u')
ORDER BY tabela, constraint_nome;

-- ========================================
-- 5. VERIFICAR TRIGGERS
-- ========================================

SELECT
  '✅ VERIFICAÇÃO DE TRIGGERS' as status;

SELECT
  tgname as trigger_nome,
  tgrelid::regclass as tabela,
  CASE
    WHEN tgenabled = 'O' THEN '✅ Habilitado'
    ELSE '⚠️ Desabilitado'
  END as status
FROM pg_trigger
WHERE tgname LIKE '%update%updated_at%'
  OR tgname LIKE '%validate%'
ORDER BY tabela, trigger_nome;

-- ========================================
-- 6. VERIFICAR PERMISSÕES (GRANTS)
-- ========================================

SELECT
  '✅ VERIFICAÇÃO DE PERMISSÕES' as status;

SELECT
  table_name as tabela,
  grantee as usuario_role,
  STRING_AGG(privilege_type, ', ') as permissoes
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN ('organizations', 'users', 'members', 'donations', 'events', 'projects')
  AND grantee = 'authenticated'
GROUP BY table_name, grantee
ORDER BY table_name;

-- ========================================
-- 7. VERIFICAR ESTRUTURA DAS TABELAS
-- ========================================

SELECT
  '✅ VERIFICAÇÃO DA ESTRUTURA - ORGANIZATIONS' as status;

SELECT
  column_name as coluna,
  data_type as tipo,
  CASE
    WHEN is_nullable = 'NO' THEN '✅ NOT NULL'
    ELSE '⚠️ Nullable'
  END as obrigatorio,
  column_default as valor_padrao
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'organizations'
ORDER BY ordinal_position;

SELECT
  '✅ VERIFICAÇÃO DA ESTRUTURA - USERS' as status;

SELECT
  column_name as coluna,
  data_type as tipo,
  CASE
    WHEN is_nullable = 'NO' THEN '✅ NOT NULL'
    ELSE '⚠️ Nullable'
  END as obrigatorio,
  column_default as valor_padrao
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- ========================================
-- 8. TESTE DE CONTAGEM DE REGISTROS
-- ========================================

SELECT
  '✅ CONTAGEM DE REGISTROS' as status;

SELECT
  'Organizations' as tabela,
  COUNT(*) as total_registros
FROM organizations
UNION ALL
SELECT
  'Users' as tabela,
  COUNT(*) as total_registros
FROM users
UNION ALL
SELECT
  'Members' as tabela,
  COUNT(*) as total_registros
FROM members
UNION ALL
SELECT
  'Donations' as tabela,
  COUNT(*) as total_registros
FROM donations
UNION ALL
SELECT
  'Events' as tabela,
  COUNT(*) as total_registros
FROM events;

-- ========================================
-- 9. VERIFICAR RELACIONAMENTOS
-- ========================================

SELECT
  '✅ VERIFICAÇÃO DE RELACIONAMENTOS (FOREIGN KEYS)' as status;

SELECT
  tc.table_name as tabela_origem,
  kcu.column_name as coluna_fk,
  ccu.table_name as tabela_destino,
  ccu.column_name as coluna_destino,
  '✅ Configurado' as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('users', 'members', 'donations', 'events', 'projects')
ORDER BY tc.table_name, kcu.column_name;

-- ========================================
-- 10. TESTE DE FUNÇÃO GET_AUTH_USER_ORGANIZATION_ID
-- ========================================

SELECT
  '✅ TESTE DA FUNÇÃO AUXILIAR' as status;

-- Verifica se a função existe e pode ser executada
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = 'get_auth_user_organization_id'
    ) THEN '✅ Função existe e está pronta para uso'
    ELSE '❌ Função não encontrada - Execute fix_registration_complete.sql'
  END as resultado;

-- ========================================
-- 11. VERIFICAR RLS HABILITADO
-- ========================================

SELECT
  '✅ VERIFICAÇÃO DE RLS HABILITADO' as status;

SELECT
  schemaname as schema,
  tablename as tabela,
  CASE
    WHEN rowsecurity THEN '✅ RLS Habilitado'
    ELSE '❌ RLS Desabilitado'
  END as status_rls
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'users', 'members', 'donations', 'events', 'projects', 'volunteers', 'financial_transactions')
ORDER BY tablename;

-- ========================================
-- 12. RESUMO FINAL
-- ========================================

SELECT
  '═══════════════════════════════════════' as divisor;

SELECT
  '📊 RESUMO DA VERIFICAÇÃO' as titulo;

SELECT
  '═══════════════════════════════════════' as divisor;

-- Contagem de políticas por tabela
WITH policy_count AS (
  SELECT
    tablename,
    COUNT(*) as total_policies
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
)
SELECT
  pc.tablename as tabela,
  pc.total_policies as total_politicas,
  CASE
    WHEN pc.total_policies >= 2 THEN '✅ Configurado'
    WHEN pc.total_policies = 1 THEN '⚠️ Parcialmente configurado'
    ELSE '❌ Não configurado'
  END as status
FROM policy_count pc
WHERE pc.tablename IN ('organizations', 'users')
ORDER BY pc.tablename;

-- ========================================
-- INSTRUÇÕES FINAIS
-- ========================================

SELECT
  '═══════════════════════════════════════' as divisor;

SELECT
  '📝 PRÓXIMOS PASSOS' as titulo;

SELECT
  '═══════════════════════════════════════' as divisor;

SELECT
  '1. Se algum item mostrar ❌ ou ⚠️, execute: fix_registration_complete.sql' as instrucao
UNION ALL
SELECT
  '2. Verifique se todos os itens mostram ✅' as instrucao
UNION ALL
SELECT
  '3. Teste o registro criando uma nova conta no app' as instrucao
UNION ALL
SELECT
  '4. Verifique os dados inseridos com as queries abaixo:' as instrucao
UNION ALL
SELECT
  '   SELECT * FROM organizations ORDER BY created_at DESC LIMIT 1;' as instrucao
UNION ALL
SELECT
  '   SELECT * FROM users ORDER BY created_at DESC LIMIT 1;' as instrucao
UNION ALL
SELECT
  '5. Confira os logs do console do app (devem mostrar emojis)' as instrucao
UNION ALL
SELECT
  '6. Teste o login com a conta criada' as instrucao
UNION ALL
SELECT
  '7. Teste atualizar o nome da organização' as instrucao;

-- ========================================
-- FIM DO SCRIPT DE TESTE
-- ========================================

SELECT
  '═══════════════════════════════════════' as divisor;

SELECT
  '✅ Script de teste concluído!' as resultado,
  NOW() as executado_em;
