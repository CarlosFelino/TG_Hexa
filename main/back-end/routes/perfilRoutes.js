import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { atualizarFotoPerfil, obterFotoPerfil, removerFotoPerfil,alterarSenha } from "../controllers/perfilController.js";
import { autenticarJWT as autenticarToken } from "../middlewares/authMiddleware.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// 📁 Configuração do Multer (Upload de fotos)
// ===============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Caminho absoluto até a pasta uploads/perfis
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
    // Nome: <userId>-<timestamp>.ext
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // máximo 2MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const isValid = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(isValid ? null : new Error("Formato inválido. Use JPG ou PNG."), isValid);
  },
});

// ===============================
// 🖼️ Upload de foto (autenticado)
// ===============================
router.post("/upload-foto", autenticarToken, upload.single("foto"), atualizarFotoPerfil);

// ===============================
// 🔐 Obter foto de perfil (autenticado)
// ===============================
router.get("/foto", autenticarToken, (req, res) => {
  const userId = req.user.id;
  const uploadDir = path.join(__dirname, "..", "uploads", "perfis");

  try {
    // Procura o arquivo que começa com o ID do usuário
    const arquivos = fs.readdirSync(uploadDir);
    const foto = arquivos.find((arq) => arq.startsWith(`${userId}-`));

    if (!foto) {
      // Caso não tenha foto, retorna uma padrão
      const defaultPath = path.join(__dirname, "..", "uploads", "default-avatar.png");
      if (fs.existsSync(defaultPath)) {
        return res.sendFile(defaultPath);
      }
      return res.status(404).json({ message: "Foto não encontrada" });
    }

    const fotoPath = path.join(uploadDir, foto);
    res.sendFile(fotoPath);
  } catch (err) {
    console.error("Erro ao obter foto:", err);
    res.status(500).json({ message: "Erro ao carregar a foto" });
  }
});

// ===============================
// 🗑️ Remover foto (autenticado)
// ===============================
router.delete("/remover-foto", autenticarToken, removerFotoPerfil);



// ===============================
// 🔐 Alterar senha (autenticado)
// ===============================
router.put("/alterar-senha", autenticarToken, alterarSenha);



// ===============================
// ✅ Exporta as rotas
// ===============================
export default router;
