# 📋 Instruções Completas - Configuração do Processo de Registro

## 🎯 Objetivo
Este guia garante que o processo de registro de novos usuários funcione perfeitamente, criando todos os dados necessários nas tabelas corretas.

---

## ⚠️ IMPORTANTE - Execute na Ordem!

### 1️⃣ **Executar o Script SQL no Supabase**

Acesse o Supabase Dashboard → SQL Editor e execute o arquivo:
```
fix_registration_complete.sql
```

Este script irá:
- ✅ Limpar políticas antigas que causam conflitos
- ✅ Criar função auxiliar para evitar recursão infinita
- ✅ Configurar políticas RLS (Row Level Security) corretas
- ✅ Adicionar índices para melhor performance
- ✅ Configurar permissões adequadas
- ✅ Garantir validação de dados

---

## 🔍 O Que o Script Faz

### **Políticas Criadas para ORGANIZATIONS:**
1. **Inserção**: Qualquer usuário autenticado pode criar uma organização
2. **Visualização**: Usuário vê apenas sua própria organização
3. **Atualização**: Usuário pode atualizar apenas sua própria organização

### **Políticas Criadas para USERS:**
1. **Inserção**: Usuário pode criar apenas seu próprio perfil
2. **Visualização**: Usuário vê seu próprio perfil e membros da mesma organização
3. **Atualização**: Usuário pode atualizar apenas seu próprio perfil

### **Políticas para Outras Tabelas:**
- Members, Donations, Events, Projects, Volunteers, Financial Transactions
- Todas isoladas por `organization_id`
- Usuários só acessam dados da própria organização

---

## 🚀 Fluxo do Processo de Registro

### **Passo 1: Criar Conta de Autenticação**
```javascript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: formData.email.trim().toLowerCase(),
  password: formData.password,
  options: {
    data: {
      full_name: formData.fullName.trim(),
    },
  },
});
```
✅ Cria usuário no `auth.users` do Supabase

### **Passo 2: Criar Organização**
```javascript
const { data: orgData, error: orgError } = await supabase
  .from("organizations")
  .insert([{
    name: formData.organizationName.trim(),
    email: formData.email.trim().toLowerCase(),
    status: "active",
    subscription_plan: "free",
  }])
  .select()
  .single();
```
✅ Cria registro na tabela `organizations`

### **Passo 3: Criar Perfil do Usuário**
```javascript
const { data: userData, error: userError } = await supabase
  .from("users")
  .insert([{
    auth_id: authData.user.id,
    organization_id: orgData.id,
    full_name: formData.fullName.trim(),
    email: formData.email.trim().toLowerCase(),
    role: "admin",
    status: "active",
  }])
  .select()
  .single();
```
✅ Cria registro na tabela `users` vinculando auth e organização

---

## 🔐 Validações Implementadas

### **No Frontend (RegisterScreen.js):**
- ✅ Nome da organização obrigatório
- ✅ Nome completo obrigatório
- ✅ Email válido (regex)
- ✅ Senha mínima de 6 caracteres
- ✅ Confirmação de senha
- ✅ Tratamento de erros detalhado
- ✅ Rollback em caso de falha (tenta deletar dados criados)

### **No Backend (SQL):**
- ✅ Constraint de email único
- ✅ Validação de formato de email
- ✅ auth_id único
- ✅ Trigger de validação antes de inserir
- ✅ Timestamps automáticos

---

## 🐛 Solução de Problemas Comuns

### **Erro: "invalid input syntax for type uuid: 'null'"**
**Causa:** ID da organização não foi carregado corretamente  
**Solução:** Validação adicionada em `OrganizationScreen.js` linha 81-84

### **Erro: "new row violates row-level security policy"**
**Causa:** Políticas RLS não configuradas corretamente  
**Solução:** Execute o script `fix_registration_complete.sql`

### **Erro: "duplicate key value violates unique constraint"**
**Causa:** Email já cadastrado  
**Solução:** Use um email diferente ou implemente verificação prévia

### **Erro: "permission denied for table organizations"**
**Causa:** Permissões GRANT não configuradas  
**Solução:** Script já inclui os GRANT necessários

---

## ✅ Verificação Pós-Instalação

Execute no SQL Editor do Supabase:

```sql
-- Verificar políticas criadas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verificar função auxiliar
SELECT 
  proname, 
  prosecdef 
FROM pg_proc 
WHERE proname = 'get_auth_user_organization_id';

-- Verificar índices criados
SELECT 
  tablename, 
  indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%';
```

---

## 📊 Estrutura de Dados Criada no Registro

```
┌─────────────────────────────────────┐
│     auth.users (Supabase Auth)      │
│  - id (UUID)                        │
│  - email                            │
│  - encrypted_password               │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│         organizations               │
│  - id (UUID) ◄──────────┐          │
│  - name                  │          │
│  - email                 │          │
│  - status                │          │
│  - subscription_plan     │          │
└─────────────────────────────────────┘
              │                 │
              │                 │
              ▼                 │
┌─────────────────────────────────────┐
│            users                    │
│  - id (UUID)                        │
│  - auth_id (UUID) ──────┐          │
│  - organization_id ──────┘          │
│  - full_name                        │
│  - email                            │
│  - role (admin)                     │
│  - status (active)                  │
└─────────────────────────────────────┘
```

---

## 🎨 Melhorias Implementadas no Código

### **RegisterScreen.js:**
1. ✅ Logs detalhados com emojis para debug
2. ✅ Validação de dados retornados de cada etapa
3. ✅ Rollback automático em caso de erro
4. ✅ Mensagens de erro mais descritivas
5. ✅ Formatação consistente (toLowerCase, trim)
6. ✅ Timestamps ISO formatados corretamente

### **OrganizationScreen.js:**
1. ✅ Validação de ID antes de atualizar
2. ✅ Tratamento de valores nulos
3. ✅ Conversão adequada de strings vazias para NULL
4. ✅ Log de debug para rastreamento

---

## 🧪 Como Testar

### **Teste 1: Registro Completo**
1. Abra o app e clique em "Criar Conta"
2. Passo 1: Digite "Minha ONG Teste"
3. Passo 2: Digite "João Silva"
4. Passo 3: Digite email e senha válidos
5. Clique em "Cadastro"
6. ✅ Deve mostrar "Sucesso!" e redirecionar para Login

### **Teste 2: Verificar Dados no Supabase**
```sql
-- Ver organizações criadas
SELECT * FROM organizations ORDER BY created_at DESC LIMIT 5;

-- Ver usuários criados
SELECT 
  u.id,
  u.full_name,
  u.email,
  u.role,
  o.name as organization_name
FROM users u
JOIN organizations o ON u.organization_id = o.id
ORDER BY u.created_at DESC LIMIT 5;

-- Verificar vinculação com auth
SELECT 
  u.full_name,
  u.email,
  au.email as auth_email
FROM users u
JOIN auth.users au ON u.auth_id = au.id
ORDER BY u.created_at DESC LIMIT 5;
```

### **Teste 3: Login e Acesso**
1. Faça login com a conta criada
2. Acesse "Mais" → "Minha Organização"
3. ✅ Deve mostrar os dados da organização
4. Edite o nome e salve
5. ✅ Deve atualizar sem erro de UUID

---

## 📞 Console de Debug

Ao registrar, você verá no console:

```
🚀 Iniciando processo de registro...
📧 Criando conta de autenticação...
✅ Conta de autenticação criada: abc123-uuid
🏢 Criando organização...
✅ Organização criada: { id: xyz789, name: "Minha ONG" }
👤 Criando perfil de usuário...
✅ Perfil de usuário criado: { id: ..., role: "admin" }
🎉 Registro concluído com sucesso!
```

Se houver erro:
```
❌ Erro ao criar organização: [detalhes do erro]
```

---

## 🔄 Atualizações Necessárias

Se você já tem um banco em produção, execute:

```sql
-- Backup antes de executar!
BEGIN;

-- Execute o script completo
\i fix_registration_complete.sql

-- Verifique se tudo está OK
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Se tudo OK, confirme
COMMIT;

-- Se houver problema, reverta
-- ROLLBACK;
```

---

## 📚 Recursos Adicionais

### **Documentação Relacionada:**
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [PostgreSQL Policies](https://www.postgresql.org/docs/current/sql-createpolicy.html)

### **Arquivos do Projeto:**
- `fix_registration_complete.sql` - Script principal de configuração
- `src/screens/RegisterScreen.js` - Tela de registro
- `src/screens/OrganizationScreen.js` - Tela de organização
- `db.sql` - Schema completo do banco

---

## ✨ Checklist Final

Antes de testar em produção:

- [ ] Script SQL executado no Supabase
- [ ] Políticas RLS verificadas
- [ ] Código do RegisterScreen atualizado
- [ ] Código do OrganizationScreen atualizado
- [ ] Teste de registro completo realizado
- [ ] Dados verificados no banco
- [ ] Login funcionando
- [ ] Atualização de organização testada
- [ ] Logs de console revisados
- [ ] Backup do banco criado

---

## 🆘 Suporte

Se encontrar problemas:

1. **Verifique os logs do console** - Os emojis facilitam a identificação
2. **Execute as queries de verificação** - Confirme que as políticas existem
3. **Teste com um email novo** - Evite conflitos de dados existentes
4. **Revise as permissões do Supabase** - Service Role vs Anon Key
5. **Confira a versão do PostgreSQL** - Algumas funções podem variar

---

**Última atualização:** 2024
**Versão do guia:** 1.0
**Compatível com:** Supabase PostgreSQL 15+