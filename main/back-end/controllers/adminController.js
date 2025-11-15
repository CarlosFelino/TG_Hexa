// controllers/adminController.js
import pool from "../config/db.js";

/**
 * Lista usuários do suporte elegíveis
 * GET /api/admin/users/suporte
 */
export const listarSuporte = async (req, res) => {
  try {
    // Aqui usamos alias para retornar { id, nome } como o front-end espera
    const result = await pool.query(
      "SELECT id, fullName AS nome FROM users WHERE tipo = $1 AND active = true ORDER BY id ASC",
      ["suporte"]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("listarSuporte:", err);
    return res.status(500).json({ error: "Erro ao listar usuários do suporte" });
  }
};

/**
 * Doação permanente de admin
 * POST /api/admin/roles/donate
 * body: { from_user_id, to_user_id }
 */
export const doarAdmin = async (req, res) => {
  const { from_user_id, to_user_id } = req.body;

  if (!from_user_id || !to_user_id) {
    return res.status(400).json({ error: "from_user_id e to_user_id são obrigatórios." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Verifica existência e estado dos usuários
    const [fromRow] = (await client.query("SELECT id, tipo, active FROM users WHERE id = $1", [from_user_id])).rows;
    const [toRow] = (await client.query("SELECT id, tipo, active FROM users WHERE id = $1", [to_user_id])).rows;

    if (!fromRow) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Usuário (from_user_id) não encontrado." });
    }
    if (!toRow) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Usuário (to_user_id) não encontrado." });
    }

    // Inativar admin atual (marca active = false)
    await client.query("UPDATE users SET active = false WHERE id = $1", [from_user_id]);

    // Promover usuário destino para admin e garantir active = true
    await client.query("UPDATE users SET tipo = 'admin', active = true WHERE id = $1", [to_user_id]);

    await client.query("COMMIT");
    return res.json({ success: true, message: "Transferência de admin concluída." });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("doarAdmin:", err);
    return res.status(500).json({ error: "Erro ao transferir role permanentemente" });
  } finally {
    client.release();
  }
};

/**
 * Promoção temporária de admin
 * POST /api/admin/roles/temporary
 * body: { user_id, data_fim }  (data_fim em formato ISO compatível com o banco)
 */
export const promoverTemporario = async (req, res) => {
  try {
    const { user_id, data_fim } = req.body;
    if (!user_id || !data_fim) {
      return res.status(400).json({ error: "user_id e data_fim são obrigatórios." });
    }

    // Validar se usuário é suporte atualmente
    const userResult = await pool.query("SELECT id, tipo FROM users WHERE id = $1", [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    const user = userResult.rows[0];
    if (user.tipo !== "suporte") {
      return res.status(400).json({ error: "Usuário não elegível para promoção temporária (deve ser 'suporte')." });
    }

    // Insere promoção temporária (role será 'admin' até data_fim)
    await pool.query(
      `INSERT INTO promocoes_temporarias (user_id, role, role_original, data_inicio, data_fim)
       VALUES ($1, 'admin', 'suporte', NOW(), $2)`,
      [user_id, data_fim]
    );

    return res.json({ success: true, message: "Promoção temporária criada." });
  } catch (err) {
    console.error("promoverTemporario:", err);
    return res.status(500).json({ error: "Erro ao criar promoção temporária" });
  }
};

/**
 * Listar todas as transferências (permanentes e temporárias)
 * GET /api/admin/roles/transfers
 */
export const listarTransferencias = async (req, res) => {
  try {
    // Administradores permanentes ativos (ex.: conta de admin atualmente ativa)
    const permanente = await pool.query(`
      SELECT id, fullName AS nome, 'Permanente' AS tipo, NULL AS data_fim, TRUE AS concluido
      FROM users
      WHERE tipo = 'admin' AND active = true
      ORDER BY id DESC
    `);

    // Promoções temporárias (tabelas relacionadas)
    const temporario = await pool.query(`
      SELECT u.id, u.fullName AS nome, 'Temporário' AS tipo, pt.data_fim,
             (NOW() <= pt.data_fim) AS concluido
      FROM promocoes_temporarias pt
      JOIN users u ON u.id = pt.user_id
      ORDER BY pt.data_fim DESC
    `);

    return res.json([...permanente.rows, ...temporario.rows]);
  } catch (err) {
    console.error("listarTransferencias:", err);
    return res.status(500).json({ error: "Erro ao listar transferências" });
  }
};
