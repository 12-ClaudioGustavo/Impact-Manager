-- =============================================
-- SCHEMA COMPLETO - ASSOCIAHUB
-- Sistema de Gestão para ONGs e Associações
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELA: organizations (Organizações/ONGs)
-- =============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  cnpj VARCHAR(18) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  website VARCHAR(255),
  description TEXT,
  logo_url TEXT,
  address JSONB, -- {street, number, complement, city, state, zip, country}
  social_media JSONB, -- {facebook, instagram, linkedin, twitter}
  foundation_date DATE,
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
  subscription_plan VARCHAR(50) DEFAULT 'free', -- free, basic, premium, enterprise
  subscription_expires_at TIMESTAMP,
  settings JSONB DEFAULT '{}', -- configurações personalizadas
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABELA: users (Usuários do sistema)
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  auth_id UUID UNIQUE, -- referência ao auth.users do Supabase
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'member', -- admin, manager, volunteer, member
  permissions JSONB DEFAULT '[]', -- array de permissões específicas
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, pending
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABELA: members (Membros/Associados)
-- =============================================
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  membership_number VARCHAR(50) UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(20),
  birth_date DATE,
  gender VARCHAR(20),
  address JSONB,
  photo_url TEXT,
  membership_type VARCHAR(50), -- regular, honorary, contributor, etc
  membership_status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended, expired
  join_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  emergency_contact JSONB, -- {name, relationship, phone}
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABELA: donations (Doações)
-- =============================================
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  donor_id UUID REFERENCES members(id) ON DELETE SET NULL,
  donor_name VARCHAR(255), -- caso seja doação externa
  donor_email VARCHAR(255),
  donor_phone VARCHAR(20),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  donation_type VARCHAR(50), -- one-time, recurring, in-kind
  payment_method VARCHAR(50), -- credit_card, pix, boleto, cash, transfer
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, refunded
  receipt_url TEXT,
  transaction_id VARCHAR(255),
  campaign_id UUID, -- referência a campanhas (tabela futura)
  donation_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  tax_deductible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABELA: events (Eventos e Atividades)
-- =============================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50), -- meeting, workshop, fundraiser, social, training
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  location VARCHAR(255),
  address JSONB,
  is_virtual BOOLEAN DEFAULT FALSE,
  virtual_link TEXT,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  registration_required BOOLEAN DEFAULT FALSE,
  registration_deadline TIMESTAMP,
  cover_image_url TEXT,
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, ongoing, completed, cancelled
  visibility VARCHAR(20) DEFAULT 'public', -- public, members_only, private
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABELA: event_participants (Participantes dos Eventos)
-- =============================================
CREATE TABLE event_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  registration_date TIMESTAMP DEFAULT NOW(),
  attendance_status VARCHAR(20) DEFAULT 'registered', -- registered, confirmed, attended, absent, cancelled
  notes TEXT,
  UNIQUE(event_id, member_id)
);

-- =============================================
-- TABELA: projects (Projetos e Programas)
-- =============================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  objectives TEXT,
  start_date DATE,
  end_date DATE,
  budget DECIMAL(12, 2),
  spent_amount DECIMAL(12, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'planning', -- planning, active, on_hold, completed, cancelled
  progress INTEGER DEFAULT 0, -- 0-100
  beneficiaries_target INTEGER,
  beneficiaries_reached INTEGER DEFAULT 0,
  cover_image_url TEXT,
  documents JSONB DEFAULT '[]', -- array de URLs de documentos
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABELA: volunteers (Voluntários)
-- =============================================
CREATE TABLE volunteers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  skills JSONB DEFAULT '[]', -- array de habilidades
  availability JSONB, -- {days, hours, preferences}
  total_hours DECIMAL(8, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  start_date DATE DEFAULT CURRENT_DATE,
  background_check BOOLEAN DEFAULT FALSE,
  background_check_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABELA: volunteer_activities (Registro de Atividades Voluntárias)
-- =============================================
CREATE TABLE volunteer_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  activity_date DATE NOT NULL,
  hours DECIMAL(5, 2) NOT NULL,
  description TEXT,
  approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABELA: financial_transactions (Transações Financeiras)
-- =============================================
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL, -- income, expense
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  payment_method VARCHAR(50),
  reference_id UUID, -- pode referenciar donation_id ou outros
  reference_type VARCHAR(50), -- donation, membership_fee, grant, etc
  account VARCHAR(100), -- conta bancária
  receipt_url TEXT,
  status VARCHAR(20) DEFAULT 'completed',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABELA: communications (Comunicações/Mensagens)
-- =============================================
CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  communication_type VARCHAR(50), -- email, sms, push, announcement
  target_audience JSONB, -- {type: 'all'|'members'|'volunteers'|'custom', ids: []}
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'draft', -- draft, scheduled, sent, failed
  recipients_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABELA: documents (Documentos e Arquivos)
-- =============================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER, -- em bytes
  category VARCHAR(100),
  tags JSONB DEFAULT '[]',
  related_to_type VARCHAR(50), -- member, project, event, etc
  related_to_id UUID,
  access_level VARCHAR(20) DEFAULT 'private', -- public, members, private
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- ÍNDICES para melhor performance
-- =============================================
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_members_org ON members(organization_id);
CREATE INDEX idx_members_status ON members(membership_status);
CREATE INDEX idx_donations_org ON donations(organization_id);
CREATE INDEX idx_donations_date ON donations(donation_date);
CREATE INDEX idx_events_org ON events(organization_id);
CREATE INDEX idx_events_dates ON events(start_date, end_date);
CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_volunteers_org ON volunteers(organization_id);
CREATE INDEX idx_financial_org ON financial_transactions(organization_id);
CREATE INDEX idx_financial_date ON financial_transactions(transaction_date);

-- =============================================
-- TRIGGERS para updated_at automático
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON financial_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS (Row Level Security) - Políticas básicas
-- =============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver dados apenas da sua organização
CREATE POLICY users_org_isolation ON users
  FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE auth_id = auth.uid()
  ));

CREATE POLICY members_org_isolation ON members
  FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE auth_id = auth.uid()
  ));

CREATE POLICY donations_org_isolation ON donations
  FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE auth_id = auth.uid()
  ));

CREATE POLICY events_org_isolation ON events
  FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE auth_id = auth.uid()
  ));

CREATE POLICY projects_org_isolation ON projects
  FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE auth_id = auth.uid()
  ));

CREATE POLICY volunteers_org_isolation ON volunteers
  FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE auth_id = auth.uid()
  ));

CREATE POLICY financial_org_isolation ON financial_transactions
  FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE auth_id = auth.uid()
  ));