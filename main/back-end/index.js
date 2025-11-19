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
import usuariosRoutes from "./routes/usuariosRoutes.js";
import gerenciarRoutes from "./routes/gerenciarRoutes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.use("/api", authRoutes);
app.use("/api", ordemRoutes);

// Servir frontend
const frontPath = path.resolve(__dirname, "../front-end");
app.use(express.static(frontPath));
app.get(/^\/(?!api).*/, (req, res) =>
  res.sendFile(path.join(frontPath, "index.html"))
);

//servir os arquivos do front-end


app.use('/uploads', express.static(path.join(process.cwd(), 'main/back-end/uploads')));

app.use("/api/perfil", perfilRoutes);


app.use("/api/admin", adminRoutes);
app.use("/api/patrimonios", patrimonioRoutes);
app.use("/api/matriculas", matriculasRoutes);
app.use("/api/admin/usuarios", usuariosRoutes);
app.use("/api/admin/usuarios", gerenciarRoutes);


app.use("/api/admin", adminDashboardRoutes);



const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT} 🚀`));

// =========================================
// 🔹 Atualizar ordens ao iniciar o servidor
// =========================================
async function atualizarStatusAoIniciar() {
  try {
    const result = await pool.query("SELECT * FROM ordens");
    const ordens = result.rows;

    const diasSimulados = process.env.SIMULAR_DIAS
      ? Number(process.env.SIMULAR_DIAS)
      : 0;

    const dataRef = dayjs().add(diasSimulados, "day");

    await atualizarOrdens(ordens, dataRef);
    console.log(
      `Status, prioridades e alertas atualizados ao iniciar ✅ (Simulação: +${diasSimulados} dias)`
    );
  } catch (err) {
    console.error("Erro ao atualizar ordens ao iniciar:", err);
  }
}

atualizarStatusAoIniciar();



export default app;
