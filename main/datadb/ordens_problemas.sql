CREATE TABLE ordens_problemas (
    id SERIAL PRIMARY KEY,
    ordem_id INT NOT NULL REFERENCES ordens(id) ON DELETE CASCADE,
    equipamento VARCHAR(100) NOT NULL,   -- ex: projetor, computador
    tipo_problema VARCHAR(100) NOT NULL -- ex: "não liga", "sem imagem"
);
