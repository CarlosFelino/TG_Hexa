import express from "express";
import { criarMatricula, listarMatriculas } from "../controllers/matriculasController.js";

const router = express.Router();

// Lista matrículas autorizadas
router.get("/", listarMatriculas);

// Cria nova matrícula autorizada
router.post("/", criarMatricula);

export default router;
