// ============================================
// 📌 CONFIGURAÇÃO COMPLETA DO INDEX.JS - CORRIGIDO
// ============================================

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import bodyParser from "body-parser";
import pool from "./config/db.js";
import dayjs from "dayjs";
import { atualizarOrdens } from "./controllers/ordemController.js";
import authRoutes from "./routes/authRoutes.js";
import ordemRoutes from "./routes/ordemRoutes.js";
import perfilRoutes from "./routes/perfilRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import patrimonioRoutes from "./routes/patrimonioRoutes.js";
import matriculasRoutes from "./routes/matriculasRoutes.js";
import gerenciarRoutes from "./routes/gerenciarRoutes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";
import relatoriosRoutes from "./routes/relatoriosRoutes.js";
import GORoutes from "./routes/GORoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// ============================================
// 🚨 ORDEM CRÍTICA DAS ROTAS
// ============================================
// Rotas mais específicas DEVEM vir ANTES das genéricas!

// Rotas da API
app.use("/api", authRoutes);
app.use("/api", ordemRoutes);
app.use("/api/perfil", perfilRoutes);

// ⚠️ ORDEM CORRETA - Rotas específicas primeiro
app.use("/api/admin", GORoutes);              // ← GORoutes DEVE VIR PRIMEIRO
app.use("/api/admin", adminDashboardRoutes);  // ← Dashboard
app.use("/api/admin", relatoriosRoutes);      // ← Relatórios
app.use("/api/admin", gerenciarRoutes);       // ← Gerenciar
app.use("/api/admin", adminRoutes);           // ← Admin genérico por último

app.use("/api/patrimonios", patrimonioRoutes);
app.use("/api/matriculas", matriculasRoutes);

// Servir frontend
const frontPath = path.resolve(__dirname, "../front-end");
app.use(express.static(frontPath));
app.use('/uploads', express.static(path.join(process.cwd(), 'main/back-end/uploads')));

app.get(/^\/(?!api).*/, (req, res) =>
  res.sendFile(path.join(frontPath, "index.html"))
);

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT} 🚀`));

// Atualizar ordens ao iniciar
async function atualizarStatusAoIniciar() {
  try {
    const result = await pool.query("SELECT * FROM ordens");
    const ordens = result.rows;
    const diasSimulados = process.env.SIMULAR_DIAS ? Number(process.env.SIMULAR_DIAS) : 0;
    const dataRef = dayjs().add(diasSimulados, "day");
    await atualizarOrdens(ordens, dataRef);
    console.log(`Status, prioridades e alertas atualizados ao iniciar ✅ (Simulação: +${diasSimulados} dias)`);
  } catch (err) {
    console.error("Erro ao atualizar ordens ao iniciar:", err);
  }
}

atualizarStatusAoIniciar();

export default app;