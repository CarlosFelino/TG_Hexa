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
      ⚠️ COMENTADO - Agora usa gerenciarRoutes.js
============================ */

// ❌ REMOVIDO - Conflitava com gerenciarRoutes
// router.get("/usuarios", async (req, res) => { ... });
// router.delete("/usuarios/:id", async (req, res) => { ... });
// router.put("/usuarios/:id", async (req, res) => { ... });

/* ============================================
    Rotas de Transferências de Admin / Suporte
============================================ */
router.get("/users/suporte", listarSuporte);
router.post("/roles/donate", doarAdmin);
router.post("/roles/temporary", promoverTemporario);
router.get("/roles/transfers", listarTransferencias);

export default router;