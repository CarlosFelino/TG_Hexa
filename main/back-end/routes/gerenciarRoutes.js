// routes/gerenciarRoutes.js
import express from "express";
import {
  listarUsuarios,
  criarUsuario,
  atualizarUsuario,
  deletarUsuario
} from "../controllers/gerenciarController.js";

const router = express.Router();

router.get("/", listarUsuarios);      // Listar todos os usuários
router.post("/", criarUsuario);       // Criar novo usuário
router.put("/:id", atualizarUsuario); // Atualizar usuário
router.delete("/:id", deletarUsuario); // Excluir usuário

export default router;
