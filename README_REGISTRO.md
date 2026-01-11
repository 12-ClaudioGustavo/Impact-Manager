# 📚 Guia Completo - Sistema de Registro e Organização

## 🎯 Visão Geral

Este guia documenta todas as correções aplicadas ao sistema de registro de usuários e gerenciamento de organizações, incluindo a resolução do erro de UUID e a implementação completa do fluxo de registro.

---

## 📋 Índice

1. [Problema Original](#-problema-original)
2. [Arquivos do Projeto](#-arquivos-do-projeto)
3. [Guia de Instalação Rápida](#-guia-de-instalação-rápida)
4. [Estrutura de Dados](#-estrutura-de-dados)
5. [Fluxo de Registro](#-fluxo-de-registro)
6. [Troubleshooting](#-troubleshooting)
7. [Queries Úteis](#-queries-úteis)

---

## 🚨 Problema Original

**Erro ao atualizar nome da organização:**
```
ERROR Update error: {"code": "22P02", "details": null, "hint": null, 
"message": "invalid input syntax for type uuid: \"null\""}
```

**Causa:** ID da organização estava como string "null" em vez de UUID válido.

**Solução:** Validação de dados + Políticas RLS corretas + Processo de registro completo.

---

## 📁 Arquivos do Projeto

### 🔧 Scripts SQL (Execute no Supabase)

| Arquivo | Descrição | Quando Usar |
|---------|-----------|-------------|
| `fix_registration_complete.sql` | **Script principal** - Configura todas as políticas RLS, funções e permissões | Execute primeiro, obrigatório |
| `test_registration.sql` | Script de verificação e testes | Execute após o principal para validar |
| `queries_uteis.sql` | Queries para monitoramento e debug | Use quando precisar debugar |

### 📱 Código React Native

| Arquivo | Descrição | O que foi corrigido |
|---------|-----------|---------------------|
| `src/screens/RegisterScreen.js` | Tela de registro de usuários | Processo completo com validações e rollback |
| `src/screens/OrganizationScreen.js` | Tela de gerenciamento da organização | Validação de UUID e tratamento de null |

### 📖 Documentação

| Arquivo | Descrição | Para quem |
|---------|-----------|-----------|
| `README_REGISTRO.md` | **Este arquivo** - Índice geral | Começar aqui |
| `INSTRUCOES_REGISTRO.md` | Guia detalhado passo a passo | Implementadores |
| `RESUMO_CORRECOES.md` | Resumo visual das correções | Revisores |

---

## ⚡ Guia de Instalação Rápida

### Passo 1: Executar SQL no Supabase

```sql
-- 1. Abra Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole e execute este arquivo:
fix_registration_complete.sql
```

**O que este script faz:**
- ✅ Remove políticas conflitantes antigas
- ✅ Cria função `get_auth_user_organization_id()` para evitar recursão
- ✅ Configura políticas RLS corretas para todas as tabelas
- ✅ Adiciona índices para performance
- ✅ Configura permissões (GRANT) necessárias
- ✅ Adiciona validações e constraints

### Passo 2: Verificar Instalação

```sql
-- Cole e execute no SQL Editor:
test_registration.sql
```

**Resultado esperado:**
- ✅ Todos os itens devem mostrar ✅
- ❌ Se houver ❌, re-execute o passo 1

### Passo 3: Atualizar Código React Native

Os arquivos já estão corrigidos:
- ✅ `src/screens/RegisterScreen.js` - Com logs e validações
- ✅ `src/screens/OrganizationScreen.js` - Com validação de UUID

### Passo 4: Testar no App

1. Reinicie o aplicativo
2. Clique em "Criar Conta"
3. Complete os 3 passos do formulário
4. ✅ Deve mostrar "Sucesso!" ao finalizar
5. Faça login com a conta criada
6. Vá em "Mais" → "Minha Organização"
7. Edite o nome e salve
8. ✅ Deve atualizar sem erros

---

## 🗄️ Estrutura de Dados

### Relacionamento entre Tabelas

```
┌─────────────────────────────────────┐
│     auth.users (Supabase Auth)      │
│  ┌─────────────────────────────┐    │
│  │ id (UUID)                   │    │
│  │ email                       │    │
│  │ encrypted_password          │    │
│  └─────────────────────────────┘    │
└─────────────────┬───────────────────┘
                  │ auth_id
                  ▼
┌─────────────────────────────────────┐
│         organizations               │
│  ┌─────────────────────────────┐    │
│  │ id (UUID) ◄──────────────┐  │    │
│  │ name                     │  │    │
│  │ email                    │  │    │
│  │ status: active           │  │    │
│  │ subscription_plan: free  │  │    │
│  └─────────────────────────────┘    │
└─────────────────┬───────────────────┘
                  │ organization_id
                  ▼
┌─────────────────────────────────────┐
│            users                    │
│  ┌─────────────────────────────┐    │
│  │ id (UUID)                   │    │
│  │ auth_id (UUID) ─────────────┼──► auth.users
│  │ organization_id ────────────┼──► organizations
│  │ full_name                   │    │
│  │ email                       │    │
│  │ role: admin                 │    │
│  │ status: active              │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### Dados Criados no Registro

Quando um usuário se registra, são criados **3 registros**:

1. **auth.users** - Credenciais de login (Supabase Auth)
2. **organizations** - Dados da organização
3. **users** - Perfil do usuário (vincula auth + org)

---

## 🔄 Fluxo de Registro

### Sequência de Operações

```
1️⃣ CRIAR CONTA DE AUTENTICAÇÃO
   ↓
   supabase.auth.signUp({
     email, password
   })
   ↓
   ✅ Retorna: authData.user.id

2️⃣ CRIAR ORGANIZAÇÃO
   ↓
   INSERT INTO organizations (
     name, email, status, subscription_plan
   )
   ↓
   ✅ Retorna: orgData.id

3️⃣ CRIAR PERFIL DO USUÁRIO
   ↓
   INSERT INTO users (
     auth_id, organization_id, full_name, 
     email, role: 'admin'
   )
   ↓
   ✅ Retorna: userData

4️⃣ SUCESSO!
   ↓
   - Usuário pode fazer login
   - Acessa apenas dados da sua organização
   - É admin da organização
```

### Código Implementado

```javascript
// RegisterScreen.js - handleRegister()

// 1. Criar auth
const { data: authData, error: authError } = 
  await supabase.auth.signUp({
    email: formData.email.trim().toLowerCase(),
    password: formData.password,
  });

// 2. Criar organização
const { data: orgData, error: orgError } = 
  await supabase.from("organizations").insert([{
    name: formData.organizationName.trim(),
    email: formData.email.trim().toLowerCase(),
    status: "active",
    subscription_plan: "free",
  }]).select().single();

// 3. Criar usuário
const { data: userData, error: userError } = 
  await supabase.from("users").insert([{
    auth_id: authData.user.id,
    organization_id: orgData.id,
    full_name: formData.fullName.trim(),
    email: formData.email.trim().toLowerCase(),
    role: "admin",
    status: "active",
  }]).select().single();
```

---

## 🐛 Troubleshooting

### Erro: "invalid input syntax for type uuid: 'null'"

**Sintomas:**
- Erro ao atualizar organização
- UUID aparece como string "null"

**Solução:**
```javascript
// ✅ Validação adicionada em OrganizationScreen.js
if (!orgData.id) {
  Alert.alert("Erro", "ID da organização não encontrado.");
  return;
}
```

### Erro: "new row violates row-level security policy"

**Sintomas:**
- Erro ao criar organização ou usuário
- Permission denied

**Solução:**
1. Execute: `fix_registration_complete.sql`
2. Verifique políticas: `SELECT * FROM pg_policies WHERE schemaname = 'public';`

### Erro: "duplicate key value violates unique constraint"

**Sintomas:**
- Email já cadastrado
- Erro ao criar organização

**Solução:**
- Use um email diferente
- Ou exclua o registro antigo no banco

### Organizações sem usuários

**Diagnóstico:**
```sql
SELECT o.* FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id
WHERE u.id IS NULL;
```

**Solução:**
- Processo de registro incompleto
- Execute o script completo novamente

---

## 📊 Queries Úteis

### Ver últimos registros

```sql
-- Últimas organizações criadas
SELECT 
  o.name, 
  o.email, 
  o.created_at,
  COUNT(u.id) as total_usuarios
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id
GROUP BY o.id
ORDER BY o.created_at DESC
LIMIT 5;
```

### Verificar integridade

```sql
-- Organizações sem usuários (problema!)
SELECT o.* FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id
WHERE u.id IS NULL;

-- Usuários sem organização (problema!)
SELECT * FROM users WHERE organization_id IS NULL;
```

### Health Check

```sql
-- Verificar se tudo está OK
SELECT 
  'Organizations' as tabela, 
  COUNT(*) as total 
FROM organizations
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Políticas RLS', COUNT(*) FROM pg_policies 
WHERE schemaname = 'public';
```

**Para mais queries:** Veja `queries_uteis.sql`

---

## 🔒 Segurança - Políticas RLS

### Organizations

```sql
-- Inserção: Qualquer usuário autenticado
FOR INSERT TO authenticated WITH CHECK (true)

-- Visualização: Apenas sua organização
FOR SELECT USING (id = get_auth_user_organization_id())

-- Atualização: Apenas sua organização
FOR UPDATE USING (id = get_auth_user_organization_id())
```

### Users

```sql
-- Inserção: Apenas próprio perfil
FOR INSERT WITH CHECK (auth_id = auth.uid())

-- Visualização: Próprio perfil + mesma organização
FOR SELECT USING (
  auth_id = auth.uid() OR 
  organization_id = get_auth_user_organization_id()
)
```

### Outras Tabelas (Members, Donations, Events, etc.)

```sql
-- Todas: Isoladas por organização
FOR ALL USING (organization_id = get_auth_user_organization_id())
```

---

## 📱 Logs de Debug

O código implementa logs detalhados com emojis:

```javascript
console.log("🚀 Iniciando processo de registro...");
console.log("📧 Criando conta de autenticação...");
console.log("✅ Conta criada:", authData.user.id);
console.log("🏢 Criando organização...");
console.log("✅ Organização criada:", orgData);
console.log("👤 Criando perfil de usuário...");
console.log("✅ Perfil criado:", userData);
console.log("🎉 Registro concluído com sucesso!");
```

**Em caso de erro:**
```javascript
console.error("❌ Erro ao criar organização:", orgError);
```

---

## ✅ Checklist de Implementação

- [ ] Script `fix_registration_complete.sql` executado
- [ ] Script `test_registration.sql` retorna todos ✅
- [ ] Função `get_auth_user_organization_id()` existe
- [ ] Políticas RLS verificadas (15+ políticas)
- [ ] Índices criados (8+ índices)
- [ ] Código React Native atualizado
- [ ] Teste de registro realizado
- [ ] Login funcionando
- [ ] Atualização de organização sem erros
- [ ] Logs aparecem no console
- [ ] Dados corretos no banco verificados

---

## 📚 Arquivos de Referência

### Para Implementação
1. **`INSTRUCOES_REGISTRO.md`** - Guia detalhado passo a passo
2. **`fix_registration_complete.sql`** - Script SQL principal
3. **`test_registration.sql`** - Verificação e testes

### Para Desenvolvimento
4. **`queries_uteis.sql`** - Queries de monitoramento
5. **`RESUMO_CORRECOES.md`** - Resumo das correções
6. **`db.sql`** - Schema completo do banco

---

## 🆘 Suporte

### Se encontrar problemas:

1. **Verifique os logs** - Emojis facilitam identificação
2. **Execute test_registration.sql** - Confirme configuração
3. **Verifique as políticas RLS** - Devem estar ativas
4. **Teste com email novo** - Evite conflitos
5. **Confira permissões** - Service Role vs Anon Key

### Comandos úteis:

```sql
-- Ver todas as políticas
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Ver função auxiliar
SELECT * FROM pg_proc WHERE proname = 'get_auth_user_organization_id';

-- Ver últimos erros (se logados)
SELECT * FROM logs ORDER BY created_at DESC LIMIT 10;
```

---

## 🎉 Resultado Final

✅ **Registro completo** - Cria auth + organização + usuário  
✅ **Validações robustas** - Em cada etapa do processo  
✅ **Rollback automático** - Se algo falhar  
✅ **Logs detalhados** - Para debug fácil  
✅ **Políticas RLS corretas** - Segurança garantida  
✅ **Performance otimizada** - Com índices  
✅ **UUID corrigido** - Sem erros de "null"  
✅ **Isolamento de dados** - Por organização  

---

## 📞 Contato

Para dúvidas ou suporte adicional, consulte:
- Documentação do Supabase: https://supabase.com/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/

---

**Versão:** 1.0  
**Última atualização:** 2024  
**Compatibilidade:** Supabase PostgreSQL 15+  
**Status:** ✅ Pronto para produção

---

## 🚀 Início Rápido (TL;DR)

```bash
# 1. Execute no Supabase SQL Editor
fix_registration_complete.sql

# 2. Verifique se funcionou
test_registration.sql

# 3. Teste no app
- Criar conta
- Fazer login
- Editar organização

# ✅ Pronto!
```
