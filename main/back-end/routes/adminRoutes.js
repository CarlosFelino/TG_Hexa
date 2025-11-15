import express from "express";
import pool from "../config/db.js";
import {
  listarSuporte,
  doarAdmin,
  promoverTemporario,
  listarTransferencias
} from "../controllers/adminController.js";

const router = express.Router();

/* ============================
      CRUD de Usuários
============================ */

// 🔹 Listar todos os usuários
router.get("/usuarios", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, nome, email, role FROM users ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar usuários:", err);
    res.status(500).json({ message: "Erro ao buscar usuários" });
  }
});

// 🔹 Excluir usuário
router.delete("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.json({ message: "Usuário excluído com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir usuário:", err);
    res.status(500).json({ message: "Erro ao excluir usuário" });
  }
});

// 🔹 Atualizar usuário
router.put("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, email, role } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE users 
      SET nome = $1, email = $2, role = $3 
      WHERE id = $4 
      RETURNING id, nome, email, role
      `,
      [nome, email, role, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.json({
      message: "Usuário atualizado com sucesso!",
      user: result.rows[0]
    });
  } catch (err) {
    console.error("Erro ao atualizar usuário:", err);
    res.status(500).json({ message: "Erro ao atualizar usuário" });
  }
});

/* ============================================
    Rotas de Transferências de Admin / Suporte
============================================ */

router.get("/users/suporte", listarSuporte);
router.post("/roles/donate", doarAdmin);
router.post("/roles/temporary", promoverTemporario);
router.get("/roles/transfers", listarTransferencias);

export default router;
