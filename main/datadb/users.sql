CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    matricula VARCHAR(13) UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('professor', 'suporte', 'admin')) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_matricula FOREIGN KEY (matricula)
        REFERENCES matriculas_autorizadas(matricula)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- Adicionar colunas de soft delete na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletado_por INT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS motivo_exclusao TEXT NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_users_deletado ON users(deletado_em) WHERE deletado_em IS NULL;