-- ==============================================================================
-- SISTEMA DE VERIFICAÇÃO POR CÓDIGO DE 6 DÍGITOS
-- ==============================================================================

-- 1. Criar tabela para armazenar códigos de verificação
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '15 minutes'),
  verified_at TIMESTAMP,
  attempts INT DEFAULT 0,
  CONSTRAINT unique_active_code UNIQUE(user_id, email)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);

-- Habilitar RLS
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own verification codes"
ON verification_codes FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert own verification codes"
ON verification_codes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own verification codes"
ON verification_codes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- ==============================================================================
-- 2. Função para gerar código de 6 dígitos
-- ==============================================================================
CREATE OR REPLACE FUNCTION generate_verification_code(
  p_user_id UUID,
  p_email VARCHAR
)
RETURNS VARCHAR AS $$
DECLARE
  v_code VARCHAR(6);
BEGIN
  -- Gerar código aleatório de 6 dígitos
  v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

  -- Deletar códigos anteriores do mesmo usuário/email
  DELETE FROM verification_codes
  WHERE user_id = p_user_id OR email = p_email;

  -- Inserir novo código
  INSERT INTO verification_codes (user_id, email, code)
  VALUES (p_user_id, p_email, v_code);

  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 3. Função para validar código
-- ==============================================================================
CREATE OR REPLACE FUNCTION verify_code(
  p_email VARCHAR,
  p_code VARCHAR
)
RETURNS JSON AS $$
DECLARE
  v_record RECORD;
  v_result JSON;
BEGIN
  -- Buscar código
  SELECT * INTO v_record
  FROM verification_codes
  WHERE email = p_email
    AND code = p_code
    AND verified_at IS NULL
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se não encontrou
  IF v_record.id IS NULL THEN
    -- Verificar se existe código mas está expirado
    SELECT * INTO v_record
    FROM verification_codes
    WHERE email = p_email
      AND code = p_code
      AND verified_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_record.id IS NOT NULL THEN
      RETURN json_build_object(
        'success', false,
        'error', 'code_expired',
        'message', 'Código expirado. Solicite um novo código.'
      );
    END IF;

    -- Incrementar tentativas se código existe
    UPDATE verification_codes
    SET attempts = attempts + 1
    WHERE email = p_email
      AND verified_at IS NULL;

    RETURN json_build_object(
      'success', false,
      'error', 'invalid_code',
      'message', 'Código inválido. Verifique e tente novamente.'
    );
  END IF;

  -- Verificar número de tentativas
  IF v_record.attempts >= 5 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'max_attempts',
      'message', 'Máximo de tentativas excedido. Solicite um novo código.'
    );
  END IF;

  -- Código válido, marcar como verificado
  UPDATE verification_codes
  SET verified_at = NOW()
  WHERE id = v_record.id;

  -- Atualizar auth.users para marcar email como confirmado
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = v_record.user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Email verificado com sucesso!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 4. Função para reenviar código (com rate limiting)
-- ==============================================================================
CREATE OR REPLACE FUNCTION can_resend_code(p_email VARCHAR)
RETURNS JSON AS $$
DECLARE
  v_last_code RECORD;
BEGIN
  -- Buscar último código enviado
  SELECT * INTO v_last_code
  FROM verification_codes
  WHERE email = p_email
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se não tem código anterior, pode enviar
  IF v_last_code.id IS NULL THEN
    RETURN json_build_object('can_resend', true);
  END IF;

  -- Verificar se já se passou 60 segundos
  IF v_last_code.created_at + INTERVAL '60 seconds' > NOW() THEN
    RETURN json_build_object(
      'can_resend', false,
      'wait_seconds', EXTRACT(EPOCH FROM (v_last_code.created_at + INTERVAL '60 seconds' - NOW()))::INT
    );
  END IF;

  RETURN json_build_object('can_resend', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 5. Função para limpar códigos expirados (executar periodicamente)
-- ==============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_codes()
RETURNS INT AS $$
DECLARE
  v_deleted_count INT;
BEGIN
  DELETE FROM verification_codes
  WHERE expires_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 6. Trigger para auto-cleanup (opcional)
-- ==============================================================================
CREATE OR REPLACE FUNCTION auto_cleanup_verification_codes()
RETURNS TRIGGER AS $$
BEGIN
  -- A cada 100 inserções, limpar códigos antigos
  IF (SELECT COUNT(*) FROM verification_codes) % 100 = 0 THEN
    PERFORM cleanup_expired_codes();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_cleanup_codes ON verification_codes;
CREATE TRIGGER trigger_auto_cleanup_codes
AFTER INSERT ON verification_codes
FOR EACH STATEMENT
EXECUTE FUNCTION auto_cleanup_verification_codes();

-- ==============================================================================
-- 7. Permissões
-- ==============================================================================
GRANT SELECT, INSERT, UPDATE ON verification_codes TO authenticated;
GRANT EXECUTE ON FUNCTION generate_verification_code(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_code(VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION can_resend_code(VARCHAR) TO authenticated;

-- ==============================================================================
-- QUERIES ÚTEIS
-- ==============================================================================

-- Ver códigos ativos
-- SELECT email, code, created_at, expires_at, verified_at, attempts
-- FROM verification_codes
-- WHERE expires_at > NOW() AND verified_at IS NULL
-- ORDER BY created_at DESC;

-- Ver estatísticas
-- SELECT
--   COUNT(*) FILTER (WHERE verified_at IS NOT NULL) as verified,
--   COUNT(*) FILTER (WHERE verified_at IS NULL AND expires_at > NOW()) as active,
--   COUNT(*) FILTER (WHERE verified_at IS NULL AND expires_at < NOW()) as expired
-- FROM verification_codes;
