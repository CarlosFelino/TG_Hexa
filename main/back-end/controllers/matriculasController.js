import pool from "../config/db.js";

// Listar matrículas autorizadas
export const listarMatriculas = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, matricula, role, status, nome_pre_cadastrado FROM matriculas_autorizadas ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Erro listarMatriculas:", err);
    res.status(500).json({ error: "Erro ao listar matrículas." });
  }
};

// Criar nova matrícula autorizada
export const criarMatricula = async (req, res) => {
  const { matricula, role, nome_pre_cadastrado } = req.body;

  if (!matricula || !role) {
    return res.status(400).json({
      error: "Campos obrigatórios: matricula e role."
    });
  }

  try {
    const sql = `
      INSERT INTO matriculas_autorizadas
        (matricula, role, status, nome_pre_cadastrado)
      VALUES ($1, $2, 'ativa', $3)
      RETURNING *;
    `;

    const values = [
      matricula,
      role,
      nome_pre_cadastrado || null
    ];

    await pool.query(sql, values);

    res.json({ message: "Matrícula autorizada criada com sucesso!" });

  } catch (err) {
    console.error("Erro criarMatricula:", err);

    if (err.code === "23505") {
      return res.status(400).json({ error: "Esta matrícula já existe." });
    }

    res.status(500).json({ error: "Erro ao criar nova matrícula autorizada." });
  }
};

