import { Router } from "express";
import { criarOrdem, listarOrdens } from "../controllers/ordemController.js";
import { autenticarJWT } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/ordens", autenticarJWT, criarOrdem);
router.get("/ordens", autenticarJWT, listarOrdens);

export default router;