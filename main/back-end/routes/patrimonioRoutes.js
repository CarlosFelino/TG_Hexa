import express from "express";
import multer from "multer";
import pool from "../config/db.js";

import {
  listarPatrimonios,
  adicionarPatrimonio,
  editarPatrimonio,
  deletarPatrimonio,
  importarPatrimonios
} from "../controllers/patrimonioController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Rotas principais
router.get("/", listarPatrimonios);
router.post("/", adicionarPatrimonio);

// IMPORTAÇÃO — precisa vir ANTES do GET :id
router.post("/importar", upload.single("file"), importarPatrimonios);

// Obter item por ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM patrimonios WHERE id=$1", [id]);
    if (result.rows.length === 0)
      return res.status(404).send("Patrimônio não encontrado");
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao buscar patrimônio:", err);
    res.status(500).send("Erro no servidor");
  }
});

// Editar e deletar
router.put("/:id", editarPatrimonio);
router.delete("/:id", deletarPatrimonio);

export default router;
