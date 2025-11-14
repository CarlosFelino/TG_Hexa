import pool from "../config/db.js";

// Listar usuários do suporte elegíveis
export const listarSuporte = async (req, res) => {
  try {
    const users = await pool.query(
      "SELECT id, nome FROM users WHERE role='suporte' AND active=true"
    );
    res.json(users.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar usuários do suporte" });
  }
};

// Doação permanente de admin
export const doarAdmin = async (req, res) => {
  try {
    const { from_user_id, to_user_id } = req.body;

    // 1. Inativar admin atual
    await pool.query("UPDATE users SET active=false WHERE id=$1", [from_user_id]);

    // 2. Promover usuário do suporte
    await pool.query("UPDATE users SET role='admin' WHERE id=$1", [to_user_id]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao transferir role permanentemente" });
  }
};

// Promoção temporária de admin
export const promoverTemporario = async (req, res) => {
  try {
    const { user_id, data_fim } = req.body;

    // Validar se usuário é suporte
    const user = await pool.query("SELECT role FROM users WHERE id=$1", [user_id]);
    if (!user.rows[0] || user.rows[0].role !== "suporte") {
      return res.status(400).json({ error: "Usuário não elegível" });
    }

    // Criar registro de promoção temporária
    await pool.query(
      `INSERT INTO promocoes_temporarias 
       (user_id, role, role_original, data_inicio, data_fim)
       VALUES ($1, 'admin', 'suporte', NOW(), $2)`,
      [user_id, data_fim]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar promoção temporária" });
  }
};

// Listar todas as transferências
export const listarTransferencias = async (req, res) => {
  try {
    // Permanentes
    const permanente = await pool.query(`
      SELECT id, nome, 'Permanente' AS tipo, NULL AS data_fim, TRUE AS concluido
      FROM users
      WHERE role='admin' AND active=true
    `);

    // Temporárias
    const temporario = await pool.query(`
      SELECT u.id, u.nome, 'Temporário' AS tipo, pt.data_fim,
             NOW() <= pt.data_fim AS concluido
      FROM promocoes_temporarias pt
      JOIN users u ON u.id = pt.user_id
    `);

    res.json([...permanente.rows, ...temporario.rows]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar transferências" });
  }
};
