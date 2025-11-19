// controllers/gerenciarController.js
import db from "../config/db.js";
import bcrypt from "bcrypt";

// =====================================
// LISTAR TODOS OS USUÁRIOS
// =====================================
export const listarUsuarios = async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        matricula, 
        nome, 
        email, 
        role, 
        status, 
        criado_em
      FROM users
      ORDER BY id ASC;
    `;

    const result = await db.query(query);

    // Log para debug
    console.log(`✅ ${result.rows.length} usuários encontrados`);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erro ao listar usuários:", err);
    res.status(500).json({ error: "Erro interno ao listar usuários" });
  }
};

// =====================================
// CRIAR USUÁRIO
// =====================================
export const criarUsuario = async (req, res) => {
  try {
    const { matricula, nome, email, role, status, senha } = req.body;

    // Validação
    if (!matricula || !nome || !email || !role || !senha) {
      return res.status(400).json({ 
        error: "Campos obrigatórios faltando",
        campos: { matricula, nome, email, role, senha: senha ? "✓" : "✗" }
      });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Verificar se matrícula está autorizada
    const checkMatricula = await db.query(
      "SELECT * FROM matriculas_autorizadas WHERE matricula = $1",
      [matricula]
    );

    if (checkMatricula.rowCount === 0) {
      return res.status(400).json({
        error: "Matrícula não está autorizada no sistema"
      });
    }

    // Inserir usuário
    const insert = `
      INSERT INTO users (matricula, nome, email, role, status, senha_hash)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, matricula, nome, email, role, status, criado_em;
    `;

    const result = await db.query(insert, [
      matricula,
      nome,
      email,
      role,
      status || "ativa", // Default: ativa
      senhaHash
    ]);

    console.log("✅ Usuário criado:", result.rows[0]);
    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("❌ Erro ao criar usuário:", err);

    // Erro de chave duplicada
    if (err.code === "23505") {
      return res.status(400).json({
        error: "Já existe um usuário com esta matrícula ou email"
      });
    }

    // Erro de constraint (matrícula não autorizada)
    if (err.code === "23503") {
      return res.status(400).json({
        error: "Matrícula não está autorizada. Cadastre-a primeiro em 'Importar Matrículas'."
      });
    }

    res.status(500).json({ error: "Erro interno ao criar usuário" });
  }
};

// =====================================
// ATUALIZAR USUÁRIO
// =====================================
export const atualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, role, status } = req.body;

    const updateQuery = `
      UPDATE users
      SET nome = $1,
          email = $2,
          role = $3,
          status = $4
      WHERE id = $5
      RETURNING id, matricula, nome, email, role, status, criado_em;
    `;

    const result = await db.query(updateQuery, [
      nome,
      email,
      role,
      status || 'ativa',
      id
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    console.log("✅ Usuário atualizado:", result.rows[0]);
    res.json(result.rows[0]);

  } catch (err) {
    console.error("❌ Erro ao atualizar usuário:", err);
    res.status(500).json({ error: "Erro interno ao atualizar usuário" });
  }
};

// =====================================
// DELETAR USUÁRIO
// =====================================
export const deletarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const del = await db.query("DELETE FROM users WHERE id = $1 RETURNING *", [id]);

    if (del.rowCount === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    console.log("✅ Usuário excluído:", del.rows[0]);
    res.json({ message: "Usuário excluído com sucesso" });

  } catch (err) {
    console.error("❌ Erro ao deletar usuário:", err);
    res.status(500).json({ error: "Erro interno ao excluir usuário" });
  }
};