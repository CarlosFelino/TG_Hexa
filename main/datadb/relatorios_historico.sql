-- ============================================
-- 📊 TABELA DE HISTÓRICO DE RELATÓRIOS
-- ============================================

CREATE TABLE IF NOT EXISTS relatorios_historico (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nome_relatorio VARCHAR(100) NOT NULL,
    tipo_relatorio VARCHAR(50) NOT NULL,
    formato VARCHAR(10) NOT NULL DEFAULT 'PDF',
    data_geracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tamanho_kb DECIMAL(10, 2),
    arquivo_nome VARCHAR(255) NOT NULL
);

-- Índices para melhor performance
CREATE INDEX idx_relatorios_usuario ON relatorios_historico(usuario_id);
CREATE INDEX idx_relatorios_data ON relatorios_historico(data_geracao DESC);