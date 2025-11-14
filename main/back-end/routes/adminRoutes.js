import express from "express";
import pool from "../config/db.js";
import {
  listarSuporte,
  doarAdmin,
  promoverTemporario,
  listarTransferencias
} from "../controllers/adminController.js";

const router = express.Router();

// ---------------------
// Rotas existentes
// ---------------------

// Listar todos os usuários
router.get("/usuarios", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, nome, email, role FROM users ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar usuários" });
  }
});

// Excluir usuário
router.delete("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ message: "Usuário não encontrado" });
    res.json({ message: "Usuário excluído com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao excluir usuário" });
  }
});

// ---------------------
// Rotas novas (transferência de admin)
// ---------------------

// Listar usuários do suporte
router.get("/users/suporte", listarSuporte);

// Doação permanente
router.post("/roles/donate", doarAdmin);

// Promoção temporária
router.post("/roles/temporary", promoverTemporario);

// Listar todas as transferências
router.get("/roles/transfers", listarTransferencias);

export default router;
