CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    matricula VARCHAR(13) UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('professor', 'suporte')) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_matricula FOREIGN KEY (matricula)
        REFERENCES matriculas_autorizadas(matricula)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);
