// ============================================
// 🛣️ ROTAS DE RELATÓRIOS - SUPPORT NEXUS
// ============================================

import express from "express";
import { autenticarJWT } from "../middlewares/authMiddleware.js";
import {
  gerarRelatorioOrdens,
  gerarRelatorioUsuarios,
  gerarRelatorioPatrimonio,
  gerarRelatorioMatriculas,
  gerarRelatorioDesempenho,
  obterHistorico,
  obterEstatisticas
} from "../controllers/relatoriosController.js";

const router = express.Router();

// ============================================
// 📊 ROTAS DE GERAÇÃO DE RELATÓRIOS
// ============================================

router.get("/relatorios/ordens", autenticarJWT, gerarRelatorioOrdens);
router.get("/relatorios/usuarios", autenticarJWT, gerarRelatorioUsuarios);
router.get("/relatorios/patrimonio", autenticarJWT, gerarRelatorioPatrimonio);
router.get("/relatorios/matriculas", autenticarJWT, gerarRelatorioMatriculas);
router.get("/relatorios/desempenho", autenticarJWT, gerarRelatorioDesempenho);

// ============================================
// 📋 ROTAS DE HISTÓRICO E ESTATÍSTICAS
// ============================================

router.get("/relatorios/historico", autenticarJWT, obterHistorico);
router.get("/relatorios/estatisticas", autenticarJWT, obterEstatisticas);

export default router;
