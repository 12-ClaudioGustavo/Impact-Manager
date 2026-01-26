-- Este ficheiro documenta as alterações feitas na estrutura da base de dados Supabase
-- para suportar as novas funcionalidades da aplicação.

-- Migração 1: Adicionar suporte para múltiplos tipos de doação
ALTER TABLE donations
ADD COLUMN donation_type TEXT;

ALTER TABLE donations
ADD COLUMN description TEXT;

-- Tornar a coluna 'amount' opcional para doações não monetárias
ALTER TABLE donations
ALTER COLUMN amount DROP NOT NULL;


-- Migração 2: Adicionar campos detalhados ao formulário de doações
ALTER TABLE donations
ADD COLUMN donor_contact TEXT,
ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE,
ADD COLUMN delivery_method TEXT,
ADD COLUMN notes TEXT;

-- Migração 3: Adicionar suporte para notificações push
ALTER TABLE users
ADD COLUMN push_token TEXT;
