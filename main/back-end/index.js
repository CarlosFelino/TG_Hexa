import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import ordemRoutes from "./routes/ordemRoutes.js";
import perfilRoutes from "./routes/perfil.js";
import adminRoutes from "./routes/adminRoutes.js"; // ← adicionei aqui

import pool from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// -------------------------------
// Rotas da API
// -------------------------------
app.use("/api", authRoutes);
app.use("/api", ordemRoutes);
app.use("/perfil", perfilRoutes);
app.use("/api/admin", adminRoutes); // ← rota do admin

// -------------------------------
// Servir frontend
// -------------------------------
const frontPath = path.resolve(__dirname, "../front-end");
app.use(express.static(frontPath));
app.get(/^\/(?!api).*/, (req, res) =>
  res.sendFile(path.join(frontPath, "index.html"))
);

// -------------------------------
// Atualização de alertas (roda todo dia)
// -------------------------------
async function atualizarAlertas() {
  await pool.query("SELECT calcula_alerta();");
}
setInterval(atualizarAlertas, 24 * 60 * 60 * 1000); // roda todo dia

// -------------------------------
// Servir arquivos de upload
// -------------------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -------------------------------
// Start do servidor
// -------------------------------
const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT} 🚀`));

export default app;
