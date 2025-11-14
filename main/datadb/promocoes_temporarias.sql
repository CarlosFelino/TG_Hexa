CREATE TABLE promocoes_temporarias (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    role VARCHAR(20) CHECK (role = 'admin') NOT NULL,
    role_original VARCHAR(20) CHECK (role_original = 'suporte') NOT NULL,
    data_inicio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_fim TIMESTAMP NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
