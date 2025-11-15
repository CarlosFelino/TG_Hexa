import { Router } from "express";
import {
  criarOrdem,
  listarOrdens,
  concluirOrdem,
  listarOrdensDetalhadas,
  avaliarOrdem,
  assumirOrdem,
  listarAlertasOrdensPendentes
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

// Listar apenas as ordens do usuário logado (professor)
router.get("/minhas-ordens", autenticarJWT, listarOrdens);

// Nova rota detalhada (usada pela tela de listagem)
router.get("/ordens-detalhadas", autenticarJWT, listarOrdensDetalhadas);

/* ===========================================================
   Ações sobre ordens existentes
=========================================================== */

// Concluir uma ordem
router.post("/ordens/:ordemId/concluir", autenticarJWT, concluirOrdem);

// Avaliar uma ordem concluída
router.post("/ordens/:ordemId/avaliar", autenticarJWT, avaliarOrdem);

// Assumir uma ordem pendente
router.post("/ordens/:ordemId/assumir", autenticarJWT, assumirOrdem);

/* ===========================================================
   Alertas e monitoramento
=========================================================== */

// Listar ordens pendentes sem responsável
router.get("/ordens/alertas/pendentes", autenticarJWT, listarAlertasOrdensPendentes);

export default router;
