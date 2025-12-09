CREATE TABLE matriculas_autorizadas (
  id SERIAL PRIMARY KEY,
  matricula VARCHAR(13) UNIQUE NOT NULL,
  role VARCHAR(20) CHECK (role IN ('professor', 'suporte', 'admin')) NOT NULL,
  status VARCHAR(10) CHECK (status IN ('ativa', 'inativa')) NOT NULL,
  nome_pre_cadastrado VARCHAR(100)
);

INSERT INTO matriculas_autorizadas (matricula, role, status, nome_pre_cadastrado)
VALUES 

('00001', 'professor', 'ativa', 'Obi-Wan Kenobi'),
('2023000000002', 'suporte', 'ativa', 'Jean-Luc Picard'),
('00002', 'professor', 'inativa', 'Arya Stark'),
('00003', 'professor', 'ativa', 'Spock'),
('2023000000005', 'suporte', 'ativa', 'Han Solo'),
('00004', 'professor', 'ativa', 'Daenerys Targaryen'),
('2023000000007', 'suporte', 'inativa', 'Sansa Stark'),
('00005', 'professor', 'ativa', 'Luke Skywalker'),
('2023000000009', 'suporte', 'ativa', 'Tyrion Lannister'),
('00006', 'professor', 'ativa', 'Leia Organa'),
('00007', 'professor', 'inativa', 'Joffrey Baratheon'),
('2023000000012', 'suporte', 'ativa', 'Rey Skywalker'),
('00008', 'professor', 'ativa', 'James T. Kirk'),
('2023000000014', 'suporte', 'inativa', 'Cersei Lannister'),
('2023000000015', 'admin', 'ativa', 'Daemon Targaryen');

