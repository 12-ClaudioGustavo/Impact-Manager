# ✅ PASSO A PASSO - Configuração Completa do Registro

## 🎯 O que você vai fazer:
Configurar o sistema para que o registro de novas contas funcione perfeitamente, criando todos os dados necessários nas tabelas corretas.

---

## 📋 ETAPA 1: CONFIGURAR O BANCO DE DADOS

### ✅ Passo 1.1 - Executar Script SQL Principal
1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor** (ícone de código na barra lateral)
3. Clique em **New query**
4. Abra o arquivo `fix_registration_complete.sql` deste projeto
5. Copie TODO o conteúdo
6. Cole no SQL Editor do Supabase
7. Clique em **RUN** (ou pressione Ctrl+Enter)
8. ⏳ Aguarde concluir (deve mostrar "Success")

**✅ Resultado esperado:** Mensagem "Success. No rows returned"

---

### ✅ Passo 1.2 - Verificar Instalação
1. No SQL Editor, abra uma **nova query**
2. Abra o arquivo `test_registration.sql` deste projeto
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em **RUN**
6. 👀 Verifique os resultados

**✅ Resultado esperado:** 
- Todos os checks devem mostrar ✅
- Se aparecer ❌, volte ao Passo 1.1

---

## 📱 ETAPA 2: CÓDIGO JÁ ESTÁ ATUALIZADO

Os seguintes arquivos já foram corrigidos automaticamente:
- ✅ `src/screens/RegisterScreen.js`
- ✅ `src/screens/OrganizationScreen.js`

**Nada precisa ser feito nesta etapa!**

---

## 🧪 ETAPA 3: TESTAR O REGISTRO

### ✅ Passo 3.1 - Iniciar o App
```bash
# No terminal, dentro da pasta myapp:
npm start
```

ou

```bash
npx expo start
```

---

### ✅ Passo 3.2 - Criar Uma Conta de Teste
1. No app, clique em **"Criar Conta"**
2. **Passo 1:** Digite um nome de organização
   - Exemplo: "Teste ONG 123"
3. Clique em **"Próximo"**
4. **Passo 2:** Digite seu nome completo
   - Exemplo: "João Silva"
5. Clique em **"Próximo"**
6. **Passo 3:** Preencha os dados de login
   - Email: Use um email NOVO (não cadastrado)
   - Senha: Mínimo 6 caracteres
   - Confirme a senha
7. Clique em **"Cadastro"**

**✅ Resultado esperado:**
```
Alerta: "Sucesso!"
Mensagem: "Sua conta foi criada com sucesso! Você já pode fazer login."
```

---

### ✅ Passo 3.3 - Verificar os Logs
Abra o console do terminal onde o app está rodando e veja:

```
🚀 Iniciando processo de registro...
📧 Criando conta de autenticação...
✅ Conta de autenticação criada: [uuid]
🏢 Criando organização...
✅ Organização criada: { id: [uuid], name: "..." }
👤 Criando perfil de usuário...
✅ Perfil de usuário criado: [dados]
🎉 Registro concluído com sucesso!
```

**✅ Esperado:** Ver todos os emojis de sucesso (✅)  
**❌ Se ver erros:** Anote a mensagem e veja a seção "Problemas Comuns"

---

### ✅ Passo 3.4 - Verificar Dados no Banco
1. Volte ao **Supabase Dashboard**
2. Vá em **Table Editor**
3. Abra a tabela **organizations**
   - ✅ Deve ter 1 novo registro
   - ✅ Com o nome que você digitou
4. Abra a tabela **users**
   - ✅ Deve ter 1 novo registro
   - ✅ Com seu nome completo
   - ✅ role = "admin"
   - ✅ organization_id preenchido

**Ou execute no SQL Editor:**
```sql
-- Ver último registro criado
SELECT 
  o.name as organizacao,
  u.full_name as usuario,
  u.role,
  o.created_at
FROM organizations o
JOIN users u ON u.organization_id = o.id
ORDER BY o.created_at DESC
LIMIT 1;
```

---

### ✅ Passo 3.5 - Fazer Login
1. No app, vá para tela de **Login**
2. Digite o email e senha que você cadastrou
3. Clique em **"Entrar"**

**✅ Resultado esperado:** Acesso ao Dashboard do app

---

### ✅ Passo 3.6 - Testar Atualização da Organização
1. No app, vá em **"Mais"** (última aba)
2. Clique em **"Minha Organização"**
3. ✅ Deve mostrar o nome da organização
4. Edite o nome (ex: adicione " - Atualizado")
5. Clique em **"Salvar Alterações"**

**✅ Resultado esperado:**
```
Alerta: "Sucesso"
Mensagem: "Organização atualizada com sucesso!"
```

**❌ NÃO DEVE aparecer:** Erro de UUID "null"

---

## 🎉 PRONTO!

Se você completou todos os passos com sucesso (✅), o sistema está funcionando corretamente!

---

## ❌ PROBLEMAS COMUNS

### Problema 1: "new row violates row-level security policy"
**Causa:** Script SQL não foi executado ou executado com erro

**Solução:**
1. Volte ao Passo 1.1
2. Execute novamente `fix_registration_complete.sql`
3. Verifique se aparece "Success"
4. Execute o Passo 1.2 para confirmar

---

### Problema 2: "duplicate key value violates unique constraint"
**Causa:** Email já cadastrado no banco

**Solução:**
1. Use um email diferente
2. Ou delete o registro antigo no Supabase:
```sql
DELETE FROM users WHERE email = 'seu@email.com';
DELETE FROM organizations WHERE email = 'seu@email.com';
```

---

### Problema 3: "invalid input syntax for type uuid: 'null'"
**Causa:** Dados não foram salvos corretamente

**Solução:**
1. Verifique no Supabase se a organização foi criada
2. Verifique se o usuário tem `organization_id` preenchido
3. Se não, delete e recrie a conta

---

### Problema 4: Não aparece organização na tela
**Causa:** Usuário não tem `organization_id`

**Solução:**
```sql
-- Verificar se o usuário tem organization_id
SELECT 
  full_name, 
  email, 
  organization_id 
FROM users 
WHERE email = 'seu@email.com';

-- Se estiver NULL, o registro está incompleto
-- Delete e recrie a conta
```

---

### Problema 5: Script SQL dá erro
**Possíveis mensagens:**
- "relation already exists"
- "policy already exists"

**Solução:**
✅ Isso é NORMAL! O script tenta criar coisas que podem já existir.
O importante é chegar até o final e ver "Success" ou completar a execução.

---

## 📊 VERIFICAÇÃO FINAL

Execute esta query no SQL Editor:

```sql
-- Health Check Completo
SELECT 'Total Organizações' as metrica, COUNT(*)::text as valor
FROM organizations
UNION ALL
SELECT 'Total Usuários', COUNT(*)::text
FROM users
UNION ALL
SELECT 'Políticas RLS Ativas', COUNT(*)::text
FROM pg_policies WHERE schemaname = 'public'
UNION ALL
SELECT 'Função Auxiliar', 
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_auth_user_organization_id'
  ) THEN '✅ Existe' ELSE '❌ Não existe' END
FROM (SELECT 1) t;
```

**✅ Resultado esperado:**
- Total Organizações: 1 ou mais
- Total Usuários: 1 ou mais
- Políticas RLS Ativas: 15 ou mais
- Função Auxiliar: ✅ Existe

---

## 📞 PRECISA DE AJUDA?

1. **Verifique os logs do console** - Os emojis facilitam identificar onde parou
2. **Execute test_registration.sql** - Mostra exatamente o que está faltando
3. **Veja queries_uteis.sql** - Queries para debugar problemas específicos
4. **Leia INSTRUCOES_REGISTRO.md** - Guia detalhado com mais explicações

---

## 📚 ARQUIVOS DE REFERÊNCIA

| Arquivo | Quando usar |
|---------|-------------|
| `fix_registration_complete.sql` | Execute sempre primeiro |
| `test_registration.sql` | Para verificar se tudo está OK |
| `queries_uteis.sql` | Para debugar e monitorar |
| `README_REGISTRO.md` | Índice geral de tudo |
| `INSTRUCOES_REGISTRO.md` | Guia detalhado completo |
| `RESUMO_CORRECOES.md` | Ver o que foi corrigido |
| `PASSO_A_PASSO.md` | Este arquivo - Checklist simples |

---

## ✅ CHECKLIST RÁPIDO

- [ ] Executei `fix_registration_complete.sql` no Supabase
- [ ] Executei `test_registration.sql` e tudo mostrou ✅
- [ ] Criei uma conta de teste no app
- [ ] Vi os logs com emojis no console
- [ ] Verifiquei os dados no Supabase (organizations + users)
- [ ] Fiz login com sucesso
- [ ] Editei e salvei o nome da organização sem erros
- [ ] Não apareceu erro de UUID "null"

**Se todos os itens estão marcados: 🎉 SUCESSO!**

---

**Última atualização:** 2024  
**Versão:** 1.0  
**Tempo estimado:** 10-15 minutos