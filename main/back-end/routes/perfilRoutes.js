import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { atualizarFotoPerfil, obterFotoPerfil, removerFotoPerfil, alterarSenha } from "../controllers/perfilController.js";
import { autenticarJWT as autenticarToken } from "../middlewares/authMiddleware.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// 📁 Configuração do Multer
// ===============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "..", "uploads", "perfis");
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      console.error("Erro ao criar pasta de upload:", err);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const isValid = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(isValid ? null : new Error("Formato inválido. Use JPG ou PNG."), isValid);
  },
});

// ===============================
// 🖼️ Upload de foto
// ===============================
router.post("/upload-foto", autenticarToken, upload.single("foto"), atualizarFotoPerfil);

// ===============================
// 🔐 Obter foto de perfil
// ===============================
router.get("/foto", autenticarToken, obterFotoPerfil); // ← USA A FUNÇÃO DO CONTROLLER

// ===============================
// 🗑️ Remover foto
// ===============================
router.delete("/remover-foto", autenticarToken, removerFotoPerfil);

// ===============================
// 🔐 Alterar senha
// ===============================
router.put("/alterar-senha", autenticarToken, alterarSenha);

export default router;