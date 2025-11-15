// controllers/usuariosController.js
import pool from "../config/db.js";

/**
 * Lista usuários cadastrados (tabela users)
 * GET /api/admin/usuarios
 */
export const listarUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, employeeID AS matricula, tipo AS role, fullName AS nome, email, phone FROM users ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Erro listarUsuarios:", err);
    res.status(500).json({ error: "Erro ao listar usuários." });
  }
};

/**
 * Atualiza um usuário (PUT /api/admin/usuarios/:id)
 * body: { nome, email, role }
 */
export const atualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nome, email, role } = req.body;

  if (!nome && !email && !role) {
    return res.status(400).json({ error: "Nenhum campo para atualizar." });
  }

  const fields = [];
  const values = [];

  if (nome) {
    fields.push("fullName = ?");
    values.push(nome);
  }
  if (email) {
    fields.push("email = ?");
    values.push(email);
  }
  if (role) {
    fields.push("tipo = ?");
    values.push(role);
  }

  values.push(id);

  try {
    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
    const [result] = await pool.query(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.json({ message: "Usuário atualizado." });
  } catch (err) {
    console.error("Erro atualizarUsuario:", err);
    res.status(500).json({ error: "Erro ao atualizar usuário." });
  }
};

/**
 * Exclui um usuário
 * DELETE /api/admin/usuarios/:id
 */
export const excluirUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "DELETE FROM users WHERE id = ?", 
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.json({ message: "Usuário excluído." });
  } catch (err) {
    console.error("Erro excluirUsuario:", err);
    res.status(500).json({ error: "Erro ao excluir usuário." });
  }
};
