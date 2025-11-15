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

router.get("/", listarPatrimonios);
router.post("/", adicionarPatrimonio);
router.put("/:id", editarPatrimonio);
router.delete("/:id", deletarPatrimonio);
router.post("/importar", upload.single("file"), importarPatrimonios);
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM patrimonios WHERE id=$1", [id]);
    if (result.rows.length === 0) return res.status(404).send("Patrimônio não encontrado");
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao buscar patrimônio:", error);
    res.status(500).send("Erro no servidor");
  }
});

export default router;
