import { Router } from "express";
import {
  criarOrdem,
  listarOrdens,
  concluirOrdem,
  listarOrdensDetalhadas,
  avaliarOrdem,
  assumirOrdem,
  listarAlertasAtivos,
  buscarAnexosOrdem,
  listarMinhasOrdens  // ✅ ADICIONE ESTA IMPORTAÇÃO
} from "../controllers/ordemController.js";
import { autenticarJWT } from "../middlewares/authMiddleware.js";
import { upload } from "../utils/upload.js";

const router = Router();

/* ===========================================================
   Rotas principais
=========================================================== */

// Criar nova ordem (com suporte a anexos)
router.post("/ordens", autenticarJWT, upload.array("anexos", 3), criarOrdem);

// Listar todas as ordens (para suporte ou professor, dependendo do tipo)
router.get("/ordens", autenticarJWT, listarOrdens);

// ✅ CORRIGIDO - Listar apenas as ordens CRIADAS pelo usuário logado
router.get("/minhas-ordens", autenticarJWT, listarMinhasOrdens);

// Nova rota detalhada (usada pela tela de listagem do suporte)
router.get("/ordens-detalhadas", autenticarJWT, listarOrdensDetalhadas);

/* ===========================================================
   Ações sobre ordens existentes
=========================================================== */

// Buscar anexos de uma ordem específica
router.get("/ordens/:ordemId/anexos", autenticarJWT, buscarAnexosOrdem);

// Concluir uma ordem
router.post("/ordens/:ordemId/concluir", autenticarJWT, concluirOrdem);

// Avaliar uma ordem concluída
router.post("/ordens/:ordemId/avaliar", autenticarJWT, avaliarOrdem);

// Assumir uma ordem pendente
router.post("/ordens/:ordemId/assumir", autenticarJWT, assumirOrdem);

/* ===========================================================
   ✅ ALERTAS
=========================================================== */

// Listar alertas ativos (prioridade >= 3)
router.get("/ordens/alertas/ativos", autenticarJWT, listarAlertasAtivos);

export default router;