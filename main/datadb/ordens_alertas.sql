CREATE TABLE ordens_alertas (
    id SERIAL PRIMARY KEY,
    ordem_id INT NOT NULL REFERENCES ordens(id) ON DELETE CASCADE,
    tipo_alerta VARCHAR(30) NOT NULL CHECK (tipo_alerta IN ('prazo', 'sem_responsavel')),
    data_alerta TIMESTAMP DEFAULT NOW(),
    ativo BOOLEAN DEFAULT TRUE,
    resolvido_em TIMESTAMP DEFAULT NULL
);