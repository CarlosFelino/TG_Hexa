import fs from "fs";
import csv from "csv-parser";
import XLSX from "xlsx";
import pool from '../config/db.js';

export const listarPatrimonios = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patrimonios ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar patrimônios:', error);
    res.status(500).send('Erro no servidor');
  }
};

export const adicionarPatrimonio = async (req, res) => {
  const { patrimonio, descricao, local, status } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO patrimonios (patrimonio, descricao, local, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [patrimonio, descricao, local, status || 'Disponível']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar patrimônio:', error);
    res.status(500).send('Erro no servidor');
  }
};



export const editarPatrimonio = async (req, res) => {
  const { id } = req.params;
  const { patrimonio, descricao, local, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE patrimonios SET patrimonio=$1, descricao=$2, local=$3, status=$4 WHERE id=$5 RETURNING *',
      [patrimonio, descricao, local, status, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao editar patrimônio:', error);
    res.status(500).send('Erro no servidor');
  }
};

export const deletarPatrimonio = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM patrimonios WHERE id=$1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar patrimônio:', error);
    res.status(500).send('Erro no servidor');
  }
};

// -----------------------------------
// Importar CSV / XLSX
// -----------------------------------
export const importarPatrimonios = async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("Nenhum arquivo enviado.");

    const filePath = req.file.path;
    const fileExt = req.file.originalname.split(".").pop().toLowerCase();
    let dados = [];

    if (fileExt === "csv") {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => dados.push(row))
        .on("end", async () => {
          await inserirPatrimonios(dados);
          fs.unlinkSync(filePath);
          res.send("CSV importado com sucesso!");
        });
    } else if (fileExt === "xlsx") {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      dados = jsonData;
      await inserirPatrimonios(dados);
      fs.unlinkSync(filePath);
      res.send("XLSX importado com sucesso!");
    } else {
      res.status(400).send("Formato de arquivo não suportado.");
    }
  } catch (error) {
    console.error("Erro ao importar patrimônios:", error);
    res.status(500).send("Erro no servidor ao importar arquivo.");
  }
};

async function inserirPatrimonios(dados) {
  for (const item of dados) {
    const { id, patrimonio, descricao, local, status } = item;

    if (!id || !patrimonio || !descricao || !local) continue; // pula linhas vazias

    await pool.query(
      'INSERT INTO patrimonios (patrimonio, descricao, local, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [patrimonio, descricao, local, status]

    );
  }
}