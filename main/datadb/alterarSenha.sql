CREATE TABLE alterarSenha (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  alterada_em TIMESTAMP DEFAULT NOW(),
  ip_usuario VARCHAR(45),
  sucesso BOOLEAN DEFAULT TRUE,
  metodo VARCHAR(20) DEFAULT 'perfil', -- 'perfil' | 'admin' | 'token'
  observacao TEXT
);
