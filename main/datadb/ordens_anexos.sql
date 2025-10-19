CREATE TABLE ordens_anexos (
    id SERIAL PRIMARY KEY,
    ordem_id INT NOT NULL REFERENCES ordens(id) ON DELETE CASCADE,
    arquivo_nome VARCHAR(255),
    arquivo_url TEXT NOT NULL, -- ou caminho no servidor
    data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
