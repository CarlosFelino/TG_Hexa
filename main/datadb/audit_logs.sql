-- Criar tabela de audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES users(id) ON DELETE SET NULL,
  usuario_afetado_id INT REFERENCES users(id) ON DELETE SET NULL,
  acao VARCHAR(50) NOT NULL,
  detalhes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_audit_usuario ON audit_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_afetado ON audit_logs(usuario_afetado_id);
CREATE INDEX IF NOT EXISTS idx_audit_acao ON audit_logs(acao);
CREATE INDEX IF NOT EXISTS idx_audit_data ON audit_logs(criado_em DESC);