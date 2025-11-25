import express from "express";
import {
  listarUsuarios,
  buscarUsuarioPorId,
  criarUsuario,
  atualizarUsuario,
  deletarUsuario,
  estatisticasUsuarios
} from "../controllers/gerenciarController.js";

const router = express.Router();

// =========================
// ROTAS DE GERENCIAMENTO DE USUÁRIOS
// =========================

// 📋 GET - Listar todos os usuários
router.get("/usuarios", listarUsuarios);

// 📊 GET - Estatísticas de usuários
router.get("/usuarios/estatisticas", estatisticasUsuarios);

// 🔍 GET - Buscar usuário específico por ID
router.get("/usuarios/:id", buscarUsuarioPorId);

// ➕ POST - Criar novo usuário
router.post("/usuarios", criarUsuario);

// ✏️ PUT - Atualizar usuário existente
router.put("/usuarios/:id", atualizarUsuario);

// 🗑️ DELETE - Deletar usuário
router.delete("/usuarios/:id", deletarUsuario);

export default router;