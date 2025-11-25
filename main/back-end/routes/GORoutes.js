// ============================================
// 📌 GORoutes.js - Rotas de Gerenciamento de Ordens (Admin)
// ============================================

import express from "express";
import { 
  listarTodasOrdens,
  obterEstatisticas,
  buscarOrdemPorId,
  buscarAnexosOrdem,
  atualizarOrdem,
  atualizarStatusOrdem,
  deletarOrdem
} from "../controllers/GOController.js";
import { autenticarJWT } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ============================================
// 📋 ROTAS DE GERENCIAMENTO DE ORDENS
// ⚠️ ORDEM IMPORTANTE: Rotas específicas ANTES das genéricas!
// ============================================

/**
 * @route   GET /api/admin/ordens/estatisticas
 * @desc    Obter estatísticas das ordens
 * @access  Private (Admin)
 * ⚠️ DEVE VIR ANTES de /ordens/:id
 */
router.get("/ordens/estatisticas", autenticarJWT, obterEstatisticas);

/**
 * @route   GET /api/admin/ordens/:id/anexos
 * @desc    Buscar anexos de uma ordem específica
 * @access  Private (Admin)
 * ⚠️ DEVE VIR ANTES de /ordens/:id
 */
router.get("/ordens/:id/anexos", autenticarJWT, buscarAnexosOrdem);

/**
 * @route   PUT /api/admin/ordens/:id/status
 * @desc    Atualizar status de uma ordem
 * @access  Private (Admin)
 * ⚠️ DEVE VIR ANTES de PUT /ordens/:id
 */
router.put("/ordens/:id/status", autenticarJWT, atualizarStatusOrdem);

/**
 * @route   GET /api/admin/ordens/:id
 * @desc    Buscar uma ordem específica por ID
 * @access  Private (Admin)
 */
router.get("/ordens/:id", autenticarJWT, buscarOrdemPorId);

/**
 * @route   PUT /api/admin/ordens/:id
 * @desc    Atualizar uma ordem completa
 * @access  Private (Admin)
 */
router.put("/ordens/:id", autenticarJWT, atualizarOrdem);

/**
 * @route   DELETE /api/admin/ordens/:id
 * @desc    Deletar uma ordem
 * @access  Private (Admin)
 */
router.delete("/ordens/:id", autenticarJWT, deletarOrdem);

/**
 * @route   GET /api/admin/ordens
 * @desc    Listar todas as ordens do sistema (Admin)
 * @access  Private (Admin)
 * ⚠️ DEVE VIR POR ÚLTIMO (rota genérica)
 */
router.get("/ordens", autenticarJWT, listarTodasOrdens);

export default router;