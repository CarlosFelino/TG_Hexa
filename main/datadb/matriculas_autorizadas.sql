CREATE TABLE matriculas_autorizadas (
  id SERIAL PRIMARY KEY,
  matricula VARCHAR(13) UNIQUE NOT NULL,
  role VARCHAR(20) CHECK (role IN ('professor', 'suporte')) NOT NULL,
  status VARCHAR(10) CHECK (status IN ('ativa', 'inativa')) NOT NULL,
  nome_pre_cadastrado VARCHAR(100)
);

INSERT INTO matriculas_autorizadas (matricula, role, status, nome_pre_cadastrado)
VALUES 
('2023000000001', 'professor', 'ativa', 'Ana Paula Ferreira'),
('2023000000002', 'suporte', 'ativa', 'João Luiz Silva'),
('2023000000003', 'professor', 'inativa', 'Marcos Lima'),
('2023000000004', 'professor', 'ativa', 'Luciana Martins'),
('2023000000005', 'suporte', 'ativa', 'Pedro Henrique'),
('2023000000006', 'professor', 'ativa', 'Fernanda Souza'),
('2023000000007', 'suporte', 'inativa', 'Rafael Almeida'),
('2023000000008', 'professor', 'ativa', 'Bruna Oliveira'),
('2023000000009', 'suporte', 'ativa', 'Thiago Moreira'),
('2023000000010', 'professor', 'ativa', 'Juliana Santos'),
('2023000000011', 'professor', 'inativa', 'Carlos Daniel'),
('2023000000012', 'suporte', 'ativa', 'Aline Costa'),
('2023000000013', 'professor', 'ativa', 'Ricardo Mendes'),
('2023000000014', 'suporte', 'inativa', NULL),
('2023000000015', 'professor', 'ativa', NULL);
