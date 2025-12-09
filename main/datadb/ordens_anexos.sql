ALTER TABLE ordens_anexos ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT NOW();

CREATE TABLE ordens_anexos (
    id SERIAL PRIMARY KEY,
    ordem_id INT NOT NULL REFERENCES ordens(id) ON DELETE CASCADE,
    arquivo_nome VARCHAR(255),
    arquivo_url TEXT NOT NULL, -- ou caminho no servidor
    data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
UPDATE ordens_anexos SET criado_em = NOW() WHERE criado_em IS NULL;
