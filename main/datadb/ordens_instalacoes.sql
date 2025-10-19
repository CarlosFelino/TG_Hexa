CREATE TABLE ordens_instalacoes (
    id SERIAL PRIMARY KEY,
    ordem_id INT NOT NULL REFERENCES ordens(id) ON DELETE CASCADE,
    app_nome VARCHAR(100) NOT NULL,
    app_versao VARCHAR(50),
    app_link TEXT
);
