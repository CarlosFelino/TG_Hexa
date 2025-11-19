import fs from "fs";
import csv from "csv-parser";
import * as XLSX from "xlsx";
import db from "../config/db.js";

export const listarMatriculas = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM matriculas_autorizadas ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao listar matrículas" });
    }
};

export const importarMatriculas = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ erro: "Nenhum arquivo enviado" });
    }

    const filePath = req.file.path;
    const fileExt = req.file.originalname.split(".").pop().toLowerCase();

    try {
        let rows = [];

        // ===================================
        // 📌 LER CSV
        // ===================================
        if (fileExt === "csv") {
            rows = await new Promise((resolve, reject) => {
                const results = [];
                fs.createReadStream(filePath)
                    .pipe(csv())
                    .on("data", (row) => results.push(row))
                    .on("end", () => resolve(results))
                    .on("error", (err) => reject(err));
            });
        }

        // ===================================
        // 📌 LER XLSX
        // ===================================
        else if (fileExt === "xlsx") {
            const workbook = XLSX.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            rows = XLSX.utils.sheet_to_json(sheet);
        } else {
            return res.status(400).json({ erro: "Formato não suportado. Envie CSV ou XLSX." });
        }

        // ===================================
        // 📌 PROCESSAR LINHAS
        // Espera colunas: matricula, role, status, nome
        // ===================================
        let inseridos = 0;

        for (const item of rows) {
            const matricula = String(item.matricula).trim();
            const role = (item.role || "suporte").toLowerCase();
            const status = (item.status || "ativa").toLowerCase();
            const nome = item.nome || item.nome_pre_cadastrado || null;

            if (!matricula || matricula.length < 4) continue;

            await db.query(
                `
                INSERT INTO matriculas_autorizadas (matricula, role, status, nome_pre_cadastrado)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (matricula) 
                DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status, nome_pre_cadastrado = EXCLUDED.nome_pre_cadastrado;
                `,
                [matricula, role, status, nome]
            );

            inseridos++;
        }

        // Remover arquivo temporário
        fs.unlinkSync(filePath);

        return res.json({
            sucesso: true,
            mensagem: "Importação concluída",
            registros: inseridos
        });

    } catch (error) {
        console.error("Erro ao importar:", error);
        return res.status(500).json({ erro: "Erro ao processar arquivo" });
    }
};
