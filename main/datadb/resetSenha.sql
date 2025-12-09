CREATE TABLE resetSenha (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  expira_em TIMESTAMP NOT NULL,
  usado BOOLEAN DEFAULT FALSE
);
