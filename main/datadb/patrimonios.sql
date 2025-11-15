-- Remove a tabela antiga, se existir
DROP TABLE IF EXISTS patrimonios;

-- Cria a nova estrutura compatível com o controller
CREATE TABLE patrimonios (
  id SERIAL PRIMARY KEY,
  patrimonio VARCHAR(50) NOT NULL,
  descricao VARCHAR(100) NOT NULL,
  local VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'Disponível'
);

-- Adiciona alguns exemplos de teste
INSERT INTO patrimonios (patrimonio, descricao, local, status) VALUES
('6546546', 'Notebook Dell Inspiron', 'Laboratório 1', 'Em uso'),
('5465166', 'TV LG 43"', 'Sala 203', 'Disponível');
