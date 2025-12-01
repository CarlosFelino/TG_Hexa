import express from "express";
import { autenticarJWT } from "../middlewares/authMiddleware.js"; // ← IMPORTAR MIDDLEWARE
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
// TODAS AS ROTAS AGORA USAM autenticarJWT
// =========================

// 📋 GET - Listar todos os usuários
router.get("/usuarios", autenticarJWT, listarUsuarios);

// 📊 GET - Estatísticas de usuários
router.get("/usuarios/estatisticas", autenticarJWT, estatisticasUsuarios);

// 🔍 GET - Buscar usuário específico por ID
router.get("/usuarios/:id", autenticarJWT, buscarUsuarioPorId);

// ➕ POST - Criar novo usuário
router.post("/usuarios", autenticarJWT, criarUsuario);

// ✏️ PUT - Atualizar usuário existente
router.put("/usuarios/:id", autenticarJWT, atualizarUsuario);

// 🗑️ DELETE - Deletar usuário (CORRIGIDO - agora com middleware)
router.delete("/usuarios/:id", autenticarJWT, deletarUsuario);

export default router;