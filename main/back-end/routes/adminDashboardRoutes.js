// routes/adminDashboardRoutes.js
import express from "express";
import pool from "../config/db.js";

const router = express.Router();

router.get("/dashboard", async (req, res) => {
    try {
        // ORDENS
        const totalOrdens = await pool.query("SELECT COUNT(*) FROM ordens");
        const ordensPendentes = await pool.query("SELECT COUNT(*) FROM ordens WHERE status = 'Pendente'");
        const ordensConcluidas = await pool.query("SELECT COUNT(*) FROM ordens WHERE status = 'Concluída'");

        // USUÁRIOS - ✅ CORRIGIDO: Agora filtra apenas usuários ativos (deletado_em IS NULL)
        const totalUsuarios = await pool.query(
            "SELECT COUNT(*) FROM users WHERE deletado_em IS NULL"
        );
        const novosUsuarios = await pool.query(
            "SELECT COUNT(*) FROM users WHERE criado_em >= NOW() - INTERVAL '7 days' AND deletado_em IS NULL"
        );

        // PATRIMÔNIO
        const equipamentosCadastrados = await pool.query("SELECT COUNT(*) FROM patrimonios");

        res.json({
            totalOrdens: totalOrdens.rows[0].count,
            ordensPendentes: ordensPendentes.rows[0].count,
            ordensConcluidas: ordensConcluidas.rows[0].count,
            totalUsuarios: totalUsuarios.rows[0].count,
            novosUsuarios: novosUsuarios.rows[0].count,
            equipamentosCadastrados: equipamentosCadastrados.rows[0].count,
            recentActivity: []
        });
    } catch (err) {
        console.error("Erro ao buscar dados do dashboard:", err);
        res.status(500).json({ error: "Erro ao buscar dados do dashboard" });
    }
});

export default router;