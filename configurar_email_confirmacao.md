# 📧 Configuração de Confirmação de Email no Supabase

## 🎯 Objetivo
Configurar o Supabase para enviar emails de confirmação quando um novo usuário se registra, e bloquear o login até que o email seja confirmado.

---

## 📋 PASSO 1: CONFIGURAR AUTENTICAÇÃO NO SUPABASE

### 1.1 - Acessar Configurações de Autenticação

1. Acesse o **Supabase Dashboard**
2. Selecione seu projeto
3. Vá em **Authentication** (ícone de cadeado na barra lateral)
4. Clique em **Settings** (Configurações)

---

### 1.2 - Configurar Email de Confirmação

Na seção **Email Auth**:

#### ✅ Habilitar confirmação de email:
1. Localize a opção **"Enable email confirmations"**
2. ✅ **MARQUE** esta opção
3. Isso fará com que o Supabase envie um email de confirmação após o registro

#### ✅ Configurar comportamento após confirmação:
1. Localize **"Redirect URLs"** ou **"Site URL"**
2. Configure para onde o usuário será redirecionado após clicar no link
   - Para desenvolvimento: `http://localhost:19006`
   - Para produção: seu domínio real

---

### 1.3 - Configurar Template de Email (Opcional)

1. Na mesma seção **Authentication > Email Templates**
2. Clique em **"Confirm signup"**
3. Personalize o template do email:

```html
<h2>Confirme seu Email</h2>
<p>Obrigado por se registrar na nossa plataforma!</p>
<p>Clique no link abaixo para confirmar seu email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar Email</a></p>
<p>Ou copie e cole este link no seu navegador:</p>
<p>{{ .ConfirmationURL }}</p>
<p>Se você não criou esta conta, ignore este email.</p>
```

---

## 📋 PASSO 2: CONFIGURAR SMTP (Email Personalizado) - OPCIONAL

Por padrão, o Supabase usa seu próprio servidor SMTP. Para usar seu próprio email:

### 2.1 - Acessar Configurações de SMTP

1. Vá em **Project Settings** (ícone de engrenagem)
2. Clique em **Auth** no menu lateral
3. Role até **SMTP Settings**

### 2.2 - Configurar Servidor SMTP

Preencha os campos:

```
SMTP Host: smtp.gmail.com (ou outro provedor)
SMTP Port: 587
SMTP User: seu-email@gmail.com
SMTP Password: sua-senha-de-aplicativo
Sender Email: seu-email@gmail.com
Sender Name: Nome da Sua Organização
```

#### 📌 Exemplos de Configuração:

**Gmail:**
```
Host: smtp.gmail.com
Port: 587
Security: TLS
```

**SendGrid:**
```
Host: smtp.sendgrid.net
Port: 587
User: apikey
Password: SUA_API_KEY
```

**Mailgun:**
```
Host: smtp.mailgun.org
Port: 587
User: seu-usuario@mailgun
Password: sua-senha
```

---

## 📋 PASSO 3: CONFIGURAR POLÍTICAS RLS PARA EMAIL NÃO CONFIRMADO

Execute no **SQL Editor** do Supabase:

```sql
-- Garantir que apenas usuários com email confirmado possam acessar dados
-- Esta política já está implementada, mas vamos adicionar verificação extra

-- Criar função para verificar se o email foi confirmado
CREATE OR REPLACE FUNCTION is_email_confirmed()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT email_confirmed_at IS NOT NULL
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar verificação nas políticas existentes (OPCIONAL - mais restritivo)
-- Isso bloquearia completamente o acesso até confirmar o email

-- Exemplo: Bloquear acesso a organizations se email não confirmado
-- DROP POLICY IF EXISTS "Permitir visualizar própria organização" ON organizations;
-- CREATE POLICY "Permitir visualizar própria organização"
-- ON organizations
-- FOR SELECT
-- TO authenticated
-- USING (id = get_auth_user_organization_id() AND is_email_confirmed());
```

⚠️ **NOTA:** As políticas acima são OPCIONAIS e mais restritivas. A verificação no código do app já é suficiente.

---

## 📋 PASSO 4: TESTAR O SISTEMA

### 4.1 - Teste de Registro

1. No app, crie uma nova conta
2. ✅ Deve aparecer a mensagem: "Conta Criada! Enviamos um email de confirmação."
3. ✅ Deve redirecionar para a tela de verificação de email
4. ✅ Verifique sua caixa de entrada (e spam!)

### 4.2 - Teste de Login Sem Confirmação

1. Tente fazer login com a conta recém-criada
2. ✅ Deve aparecer: "Email Não Confirmado"
3. ✅ Deve oferecer botão para reenviar email
4. ✅ Não deve permitir acesso ao sistema

### 4.3 - Teste de Confirmação

1. Abra o email recebido
2. Clique no link de confirmação
3. ✅ Deve abrir uma página do Supabase confirmando
4. Volte ao app e tente fazer login
5. ✅ Agora deve permitir o login

### 4.4 - Teste de Reenvio

1. Na tela de verificação, clique em "Reenviar Email"
2. ✅ Deve aparecer: "Email Enviado!"
3. ✅ Botão deve ficar desabilitado por 60 segundos
4. ✅ Verifique se recebeu um novo email

---

## 🔍 VERIFICAR CONFIGURAÇÃO

Execute no **SQL Editor**:

```sql
-- Ver usuários não confirmados
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Não confirmado'
    ELSE '✅ Confirmado'
  END as status
FROM auth.users
ORDER BY created_at DESC;
```

---

## 🐛 PROBLEMAS COMUNS

### Problema 1: Email não chega

**Soluções:**
1. ✅ Verifique a pasta de SPAM
2. ✅ Verifique se o email está correto
3. ✅ Aguarde alguns minutos (pode demorar)
4. ✅ Use o botão "Reenviar Email"
5. ✅ Verifique configurações SMTP no Supabase

### Problema 2: Link de confirmação não funciona

**Soluções:**
1. ✅ Verifique o "Site URL" nas configurações
2. ✅ Certifique-se que o link não expirou (válido por 24h)
3. ✅ Tente reenviar um novo email

### Problema 3: Usuário consegue logar sem confirmar

**Causa:** Configuração não está habilitada

**Solução:**
1. Vá em Authentication > Settings
2. ✅ Marque "Enable email confirmations"
3. Salve as alterações
4. Teste novamente

### Problema 4: Erro "Email not confirmed" mesmo após confirmar

**Soluções:**
1. Faça logout completo
2. Limpe o cache do app
3. Tente fazer login novamente
4. Execute no SQL Editor:
```sql
-- Verificar se o email foi realmente confirmado
SELECT email, email_confirmed_at 
FROM auth.users 
WHERE email = 'seu@email.com';
```

---

## 📊 LOGS DE DEBUG

O sistema implementa logs detalhados:

### No Registro:
```javascript
🚀 Iniciando processo de registro...
📧 Criando conta de autenticação...
✅ Conta de autenticação criada: [uuid]
🏢 Criando organização...
✅ Organização criada
👤 Criando perfil de usuário...
✅ Perfil criado
🎉 Registro concluído com sucesso!
```

### No Login:
```javascript
🔐 Tentando fazer login...
✅ Login realizado: email@exemplo.com
⚠️ Email não confirmado
// OU
🎉 Login bem-sucedido! Email confirmado.
```

### No Reenvio de Email:
```javascript
📧 Reenviando email de confirmação para: email@exemplo.com
✅ Email reenviado com sucesso
```

---

## 📱 FLUXO COMPLETO

```
1. USUÁRIO CRIA CONTA
   ↓
2. SISTEMA ENVIA EMAIL DE CONFIRMAÇÃO
   ↓
3. REDIRECIONA PARA TELA DE VERIFICAÇÃO
   ↓
4. USUÁRIO TENTA FAZER LOGIN
   ↓
5. SISTEMA VERIFICA SE EMAIL FOI CONFIRMADO
   ↓
   [NÃO CONFIRMADO]        [CONFIRMADO]
   ↓                       ↓
   Mostra mensagem         Permite acesso
   Oferece reenviar        ↓
   ↓                       Dashboard
   USUÁRIO CLICA NO LINK
   ↓
   EMAIL CONFIRMADO ✅
   ↓
   PODE FAZER LOGIN
```

---

## 🔐 CONFIGURAÇÃO DE SEGURANÇA ADICIONAL

### Tempo de Expiração do Link

No Supabase Dashboard > Authentication > Settings:

```
Email confirmation token validity: 24 hours (padrão)
```

Você pode alterar para:
- 1 hour (mais seguro)
- 7 days (mais flexível)

### Rate Limiting

Para evitar spam de emails:

```sql
-- O Supabase já tem rate limiting built-in
-- Por padrão, limita a 3 emails por hora por usuário
```

---

## ✅ CHECKLIST DE CONFIGURAÇÃO

- [ ] "Enable email confirmations" marcado no Supabase
- [ ] Site URL configurado corretamente
- [ ] Template de email personalizado (opcional)
- [ ] SMTP configurado (opcional)
- [ ] Código do app atualizado (já feito)
- [ ] EmailVerificationScreen criada (já feito)
- [ ] Login verificando email_confirmed_at (já feito)
- [ ] Teste de registro realizado
- [ ] Email recebido na caixa de entrada
- [ ] Teste de login sem confirmação (deve bloquear)
- [ ] Link de confirmação funciona
- [ ] Teste de login após confirmação (deve permitir)
- [ ] Botão de reenvio funciona
- [ ] Cooldown de 60s funciona

---

## 📞 SUPORTE

### Documentação Oficial:
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [SMTP Setup](https://supabase.com/docs/guides/auth/auth-smtp)

### Logs do Supabase:
1. Dashboard > Logs
2. Filtrar por "auth"
3. Ver tentativas de envio de email

---

## 🎉 RESULTADO FINAL

✅ **Email de confirmação enviado** após registro  
✅ **Login bloqueado** se email não confirmado  
✅ **Mensagem clara** ao usuário  
✅ **Botão de reenvio** disponível  
✅ **Cooldown de 60s** para evitar spam  
✅ **Logs detalhados** para debug  
✅ **Tela dedicada** de verificação  
✅ **Experiência de usuário** profissional  

---

**Versão:** 1.0  
**Última atualização:** 2024  
**Status:** ✅ Pronto para uso