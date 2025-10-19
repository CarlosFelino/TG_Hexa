import { Router } from "express";
import {
  cadastrarUsuario,
  login,
  recuperarSenha,
  redefinirSenha
} from "../controllers/authController.js";

const router = Router();

router.post("/cadastro", cadastrarUsuario);
router.post("/login", login);
router.post("/recuperar-senha", recuperarSenha);
router.post("/redefinir-senha", redefinirSenha);

export default router;
