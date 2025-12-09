-- ========================================
-- Tabela ordens
-- ========================================
CREATE TABLE IF NOT EXISTS ordens (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE, 
    criador_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    responsavel_id INT REFERENCES users(id) ON DELETE SET NULL,
    tipo_solicitacao VARCHAR(20) NOT NULL CHECK (tipo_solicitacao IN ('problema', 'instalacao')),
    local_tipo VARCHAR(20) NOT NULL CHECK (local_tipo IN ('sala', 'laboratorio')),
    local_detalhe VARCHAR(255) NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    solucao TEXT,
    observacoes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Andamento', 'Concluída', 'Não Concluída')),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_finalizacao TIMESTAMP,
    prioridade INT DEFAULT 1 CHECK (prioridade BETWEEN 1 AND 5),
    avaliacao INT CHECK (avaliacao BETWEEN 1 AND 5),
    data_limite DATE GENERATED ALWAYS AS ((data_criacao + INTERVAL '9 day')::date) STORED
);

-- ========================================
-- Função para atualizar data_atualizacao
-- ========================================
CREATE OR REPLACE FUNCTION atualiza_data_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar data_atualizacao
CREATE TRIGGER trigger_atualiza_ordem
BEFORE UPDATE ON ordens
FOR EACH ROW
EXECUTE FUNCTION atualiza_data_atualizacao();


