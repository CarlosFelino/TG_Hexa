// routes/usersRoutes.js
import express from "express";
import { listarUsuarios, atualizarUsuario, excluirUsuario } from "../controllers/usuariosController.js";

const router = express.Router();

router.get("/", listarUsuarios);          // GET /api/admin/usuarios
router.put("/:id", atualizarUsuario);     // PUT /api/admin/usuarios/:id
router.delete("/:id", excluirUsuario);   // DELETE /api/admin/usuarios/:id

export default router;
