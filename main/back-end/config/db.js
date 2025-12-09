import pg from "pg";

const pool = new pg.Pool({
    user: "meu_usuario",      // seu usuário do script
    host: "127.0.0.1",
    database: "meu_banco",    // seu banco criado no script
    password: "sua_senha",    // senha do usuário
    port: 5432
});

pool.connect()
  .then(() => console.log("Postgres OK ✅"))
  .catch((err) => console.error("Erro ao conectar no Postgres ❌", err));

export default pool;