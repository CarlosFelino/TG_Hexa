CREATE TABLE matriculas_autorizadas (
  id SERIAL PRIMARY KEY,
  matricula VARCHAR(13) UNIQUE NOT NULL,
  role VARCHAR(20) CHECK (role IN ('professor', 'suporte', 'admin')) NOT NULL,
  status VARCHAR(10) CHECK (status IN ('ativa', 'inativa')) NOT NULL,
  nome_pre_cadastrado VARCHAR(100)
);

INSERT INTO matriculas_autorizadas (matricula, role, status, nome_pre_cadastrado)
VALUES 
('00001', 'professor', 'ativa', 'Ana Paula Ferreira'),
('2023000000002', 'suporte', 'ativa', 'João Luiz Silva'),
('00002', 'professor', 'inativa', 'Marcos Lima'),
('00003', 'professor', 'ativa', 'Luciana Martins'),
('2023000000005', 'suporte', 'ativa', 'Pedro Henrique'),
('00004', 'professor', 'ativa', 'Fernanda Souza'),
('2023000000007', 'suporte', 'inativa', 'Rafael Almeida'),
('00005', 'professor', 'ativa', 'Bruna Oliveira'),
('2023000000009', 'suporte', 'ativa', 'Thiago Moreira'),
('00006', 'professor', 'ativa', 'Juliana Santos'),
('00007', 'professor', 'inativa', 'Carlos Daniel'),
('2023000000012', 'suporte', 'ativa', 'Aline Costa'),
('00008', 'professor', 'ativa', 'Ricardo Mendes'),
('2023000000014', 'suporte', 'inativa', 'Diana Trevor'),
('2023000000015', 'admin', 'ativa', 'Daemon Targaryen');
