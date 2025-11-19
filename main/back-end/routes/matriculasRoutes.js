import express from "express";
import multer from "multer";
import { importarMatriculas, listarMatriculas } from "../controllers/matriculasController.js";

const router = express.Router();

// Upload para pasta temporária
const upload = multer({ dest: "uploads/" });

// Lista matrículas autorizadas
router.get("/", listarMatriculas);

// Importa CSV/XLSX
router.post("/importar", upload.single("arquivo"), importarMatriculas);

export default router;


