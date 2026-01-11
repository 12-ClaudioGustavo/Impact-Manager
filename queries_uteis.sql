-- ==============================================================================
-- QUERIES ÚTEIS - MONITORAMENTO E DEBUG
-- ==============================================================================
-- Coleção de queries para monitorar o sistema, debugar problemas e
-- verificar a saúde do banco de dados.
-- ==============================================================================

-- ========================================
-- 1. MONITORAMENTO DE REGISTROS
-- ========================================

-- Ver últimos registros criados
SELECT
  '📊 ÚLTIMOS REGISTROS CRIADOS' as titulo;

SELECT
  o.id,
  o.name as organizacao,
  o.email,
  o.created_at,
  COUNT(u.id) as total_usuarios
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id
GROUP BY o.id, o.name, o.email, o.created_at
ORDER BY o.created_at DESC
LIMIT 10;

-- ========================================
-- 2. VERIFICAR INTEGRIDADE DOS DADOS
-- ========================================

-- Organizações sem usuários (problema!)
SELECT
  '⚠️ ORGANIZAÇÕES SEM USUÁRIOS' as titulo;

SELECT
  o.id,
  o.name,
  o.email,
  o.created_at
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id
WHERE u.id IS NULL
ORDER BY o.created_at DESC;

-- Usuários sem organização (problema!)
SELECT
  '⚠️ USUÁRIOS SEM ORGANIZAÇÃO' as titulo;

SELECT
  u.id,
  u.full_name,
  u.email,
  u.auth_id
FROM users u
WHERE u.organization_id IS NULL;

-- Usuários sem auth_id (problema!)
SELECT
  '⚠️ USUÁRIOS SEM AUTH_ID' as titulo;

SELECT
  u.id,
  u.full_name,
  u.email,
  u.organization_id
FROM users u
WHERE u.auth_id IS NULL;

-- ========================================
-- 3. ESTATÍSTICAS GERAIS
-- ========================================

SELECT
  '📈 ESTATÍSTICAS GERAIS DO SISTEMA' as titulo;

SELECT
  'Total de Organizações' as metrica,
  COUNT(*)::text as valor
FROM organizations
UNION ALL
SELECT
  'Total de Usuários' as metrica,
  COUNT(*)::text as valor
FROM users
UNION ALL
SELECT
  'Total de Membros' as metrica,
  COUNT(*)::text as valor
FROM members
UNION ALL
SELECT
  'Total de Doações' as metrica,
  COUNT(*)::text as valor
FROM donations
UNION ALL
SELECT
  'Total de Eventos' as metrica,
  COUNT(*)::text as valor
FROM events
UNION ALL
SELECT
  'Total de Projetos' as metrica,
  COUNT(*)::text as valor
FROM projects;

-- ========================================
-- 4. ANÁLISE POR ORGANIZAÇÃO
-- ========================================

SELECT
  '🏢 ANÁLISE DETALHADA POR ORGANIZAÇÃO' as titulo;

SELECT
  o.name as organizacao,
  o.email,
  o.status,
  o.subscription_plan as plano,
  COUNT(DISTINCT u.id) as usuarios,
  COUNT(DISTINCT m.id) as membros,
  COUNT(DISTINCT d.id) as doacoes,
  COUNT(DISTINCT e.id) as eventos,
  COUNT(DISTINCT p.id) as projetos,
  o.created_at as criada_em
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id
LEFT JOIN members m ON m.organization_id = o.id
LEFT JOIN donations d ON d.organization_id = o.id
LEFT JOIN events e ON e.organization_id = o.id
LEFT JOIN projects p ON p.organization_id = o.id
GROUP BY o.id, o.name, o.email, o.status, o.subscription_plan, o.created_at
ORDER BY o.created_at DESC;

-- ========================================
-- 5. USUÁRIOS E SUAS ORGANIZAÇÕES
-- ========================================

SELECT
  '👥 USUÁRIOS E ORGANIZAÇÕES' as titulo;

SELECT
  u.full_name as usuario,
  u.email,
  u.role as funcao,
  u.status,
  o.name as organizacao,
  u.last_login as ultimo_acesso,
  u.created_at as criado_em
FROM users u
JOIN organizations o ON u.organization_id = o.id
ORDER BY u.created_at DESC
LIMIT 20;

-- ========================================
-- 6. VERIFICAR POLÍTICAS RLS ATIVAS
-- ========================================

SELECT
  '🔒 POLÍTICAS RLS ATIVAS' as titulo;

SELECT
  schemaname as schema,
  tablename as tabela,
  policyname as politica,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
    ELSE cmd
  END as operacao,
  roles as funcoes
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- 7. TAMANHO DAS TABELAS
-- ========================================

SELECT
  '💾 TAMANHO DAS TABELAS' as titulo;

SELECT
  schemaname as schema,
  tablename as tabela,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as tamanho_total,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as tamanho_dados,
  pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as tamanho_indices
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ========================================
-- 8. ÍNDICES E SEU USO
-- ========================================

SELECT
  '📑 ÍNDICES CRIADOS' as titulo;

SELECT
  schemaname as schema,
  tablename as tabela,
  indexname as indice,
  indexdef as definicao
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ========================================
-- 9. ATIVIDADE RECENTE
-- ========================================

SELECT
  '📅 REGISTROS CRIADOS HOJE' as titulo;

SELECT
  'Organizações' as tipo,
  COUNT(*) as total
FROM organizations
WHERE DATE(created_at) = CURRENT_DATE
UNION ALL
SELECT
  'Usuários' as tipo,
  COUNT(*) as total
FROM users
WHERE DATE(created_at) = CURRENT_DATE
UNION ALL
SELECT
  'Membros' as tipo,
  COUNT(*) as total
FROM members
WHERE DATE(created_at) = CURRENT_DATE
UNION ALL
SELECT
  'Doações' as tipo,
  COUNT(*) as total
FROM donations
WHERE DATE(created_at) = CURRENT_DATE
UNION ALL
SELECT
  'Eventos' as tipo,
  COUNT(*) as total
FROM events
WHERE DATE(created_at) = CURRENT_DATE;

-- ========================================
-- 10. ÚLTIMOS LOGINS
-- ========================================

SELECT
  '🔐 ÚLTIMOS LOGINS' as titulo;

SELECT
  u.full_name as usuario,
  u.email,
  o.name as organizacao,
  u.last_login,
  EXTRACT(EPOCH FROM (NOW() - u.last_login))/3600 as horas_desde_login
FROM users u
JOIN organizations o ON u.organization_id = o.id
WHERE u.last_login IS NOT NULL
ORDER BY u.last_login DESC
LIMIT 10;

-- ========================================
-- 11. DOAÇÕES - ANÁLISE FINANCEIRA
-- ========================================

SELECT
  '💰 ANÁLISE DE DOAÇÕES' as titulo;

SELECT
  o.name as organizacao,
  COUNT(d.id) as total_doacoes,
  COALESCE(SUM(d.amount), 0) as total_arrecadado,
  COALESCE(AVG(d.amount), 0) as ticket_medio,
  MIN(d.donation_date) as primeira_doacao,
  MAX(d.donation_date) as ultima_doacao
FROM organizations o
LEFT JOIN donations d ON d.organization_id = o.id
GROUP BY o.id, o.name
HAVING COUNT(d.id) > 0
ORDER BY total_arrecadado DESC;

-- ========================================
-- 12. EVENTOS FUTUROS
-- ========================================

SELECT
  '📆 EVENTOS FUTUROS' as titulo;

SELECT
  e.name as evento,
  o.name as organizacao,
  e.event_date as data,
  e.location as local,
  e.status,
  EXTRACT(DAY FROM (e.event_date - NOW())) as dias_ate_evento
FROM events e
JOIN organizations o ON e.organization_id = o.id
WHERE e.event_date > NOW()
ORDER BY e.event_date ASC
LIMIT 10;

-- ========================================
-- 13. PROJETOS ATIVOS
-- ========================================

SELECT
  '🚀 PROJETOS ATIVOS' as titulo;

SELECT
  p.name as projeto,
  o.name as organizacao,
  p.status,
  p.budget as orcamento,
  p.start_date as inicio,
  p.end_date as fim,
  EXTRACT(DAY FROM (p.end_date - NOW())) as dias_restantes
FROM projects p
JOIN organizations o ON p.organization_id = o.id
WHERE p.status = 'active'
  AND (p.end_date IS NULL OR p.end_date > NOW())
ORDER BY p.start_date DESC;

-- ========================================
-- 14. VERIFICAR CONSISTÊNCIA DE EMAILS
-- ========================================

SELECT
  '📧 VERIFICAÇÃO DE EMAILS' as titulo;

-- Emails duplicados entre organizações
SELECT
  email,
  COUNT(*) as total_ocorrencias
FROM organizations
GROUP BY email
HAVING COUNT(*) > 1;

-- Emails de usuários que não correspondem à organização
SELECT
  u.full_name as usuario,
  u.email as email_usuario,
  o.email as email_organizacao,
  o.name as organizacao
FROM users u
JOIN organizations o ON u.organization_id = o.id
WHERE u.email != o.email
  AND u.role = 'admin';

-- ========================================
-- 15. MEMBROS POR ORGANIZAÇÃO
-- ========================================

SELECT
  '👨‍👩‍👧‍👦 MEMBROS POR ORGANIZAÇÃO' as titulo;

SELECT
  o.name as organizacao,
  m.status,
  COUNT(*) as total
FROM members m
JOIN organizations o ON m.organization_id = o.id
GROUP BY o.name, m.status
ORDER BY o.name, m.status;

-- ========================================
-- 16. VOLUNTÁRIOS ATIVOS
-- ========================================

SELECT
  '🤝 VOLUNTÁRIOS ATIVOS' as titulo;

SELECT
  o.name as organizacao,
  COUNT(v.id) as total_voluntarios,
  COUNT(CASE WHEN v.availability = 'available' THEN 1 END) as disponiveis,
  COUNT(CASE WHEN v.availability = 'busy' THEN 1 END) as ocupados
FROM organizations o
LEFT JOIN volunteers v ON v.organization_id = o.id
GROUP BY o.id, o.name
HAVING COUNT(v.id) > 0
ORDER BY total_voluntarios DESC;

-- ========================================
-- 17. TRANSAÇÕES FINANCEIRAS RECENTES
-- ========================================

SELECT
  '💳 TRANSAÇÕES FINANCEIRAS RECENTES' as titulo;

SELECT
  ft.transaction_date as data,
  o.name as organizacao,
  ft.type as tipo,
  ft.category as categoria,
  ft.amount as valor,
  ft.description as descricao,
  ft.payment_method as metodo_pagamento
FROM financial_transactions ft
JOIN organizations o ON ft.organization_id = o.id
ORDER BY ft.transaction_date DESC
LIMIT 20;

-- ========================================
-- 18. RESUMO FINANCEIRO POR ORGANIZAÇÃO
-- ========================================

SELECT
  '💵 RESUMO FINANCEIRO POR ORGANIZAÇÃO' as titulo;

SELECT
  o.name as organizacao,
  COALESCE(SUM(CASE WHEN ft.type = 'income' THEN ft.amount ELSE 0 END), 0) as receitas,
  COALESCE(SUM(CASE WHEN ft.type = 'expense' THEN ft.amount ELSE 0 END), 0) as despesas,
  COALESCE(SUM(CASE WHEN ft.type = 'income' THEN ft.amount ELSE -ft.amount END), 0) as saldo
FROM organizations o
LEFT JOIN financial_transactions ft ON ft.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY saldo DESC;

-- ========================================
-- 19. AUDITORIA - DADOS MODIFICADOS RECENTEMENTE
-- ========================================

SELECT
  '🔍 AUDITORIA - ÚLTIMAS ATUALIZAÇÕES' as titulo;

SELECT
  'Organizations' as tabela,
  id::text,
  name as descricao,
  updated_at
FROM organizations
WHERE updated_at > NOW() - INTERVAL '7 days'
UNION ALL
SELECT
  'Users' as tabela,
  id::text,
  full_name as descricao,
  updated_at
FROM users
WHERE updated_at > NOW() - INTERVAL '7 days'
UNION ALL
SELECT
  'Members' as tabela,
  id::text,
  full_name as descricao,
  updated_at
FROM members
WHERE updated_at > NOW() - INTERVAL '7 days'
ORDER BY updated_at DESC
LIMIT 20;

-- ========================================
-- 20. HEALTH CHECK COMPLETO
-- ========================================

SELECT
  '🏥 HEALTH CHECK COMPLETO DO SISTEMA' as titulo;

SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Sistema operacional'
    ELSE '❌ Sem dados'
  END as status,
  COUNT(*) as total_organizacoes
FROM organizations;

-- Verificar se há organizações órfãs de usuários
WITH org_check AS (
  SELECT COUNT(*) as total
  FROM organizations o
  LEFT JOIN users u ON u.organization_id = o.id
  WHERE u.id IS NULL
)
SELECT
  CASE
    WHEN total = 0 THEN '✅ Todas organizações têm usuários'
    ELSE '⚠️ ' || total || ' organizações sem usuários'
  END as resultado
FROM org_check;

-- Verificar RLS
SELECT
  CASE
    WHEN COUNT(*) >= 15 THEN '✅ RLS configurado corretamente'
    ELSE '⚠️ RLS pode estar incompleto (' || COUNT(*) || ' políticas)'
  END as resultado
FROM pg_policies
WHERE schemaname = 'public';

-- Verificar função auxiliar
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'get_auth_user_organization_id'
    ) THEN '✅ Função auxiliar existe'
    ELSE '❌ Função auxiliar não encontrada'
  END as resultado;

-- ========================================
-- FIM DAS QUERIES ÚTEIS
-- ========================================

SELECT
  '═══════════════════════════════════════' as divisor;

SELECT
  '✅ Queries úteis carregadas!' as status,
  'Use estas queries para monitorar e debugar o sistema' as instrucao;
