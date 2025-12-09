import pool from "../config/db.js";
import bcrypt from "bcrypt";

// =========================
// 🔧 FUNÇÕES AUXILIARES
// =========================

// Validar email (aceita @fatec.sp.gov.br e @proton.me)
function validarEmail(email) {
  return email.endsWith('@fatec.sp.gov.br') || email.endsWith('@proton.me');
}

// =========================
// 🔧 Registrar log de auditoria
// =========================
async function registrarAuditLog(client, usuarioId, usuarioAfetadoId, acao, detalhes, req) {
  try {
    const userExists = await client.query(
      'SELECT id FROM users WHERE id = $1',
      [usuarioAfetadoId]
    );

    const finalUsuarioAfetadoId = userExists.rows.length > 0 ? usuarioAfetadoId : null;

    await client.query(
      `INSERT INTO audit_logs (usuario_id, usuario_afetado_id, acao, detalhes, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        usuarioId,
        finalUsuarioAfetadoId,
        acao,
        JSON.stringify({
          ...detalhes,
          usuario_afetado_id_original: usuarioAfetadoId
        }),
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent']
      ]
    );
    console.log('✅ [AUDIT] Log registrado com sucesso');
  } catch (error) {
    console.error('❌ [AUDIT] Erro ao registrar audit log:', error.message);
  }
}

// =========================
// 📋 LISTAR USUÁRIOS ATIVOS (CORRIGIDO COM STATUS REAL)
// =========================
export const listarUsuarios = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id,
        u.matricula,
        u.nome as name,
        u.email,
        u.role,
        COALESCE(ma.status, 'ativa') as status_matricula,
        CASE 
          WHEN u.deletado_em IS NULL AND COALESCE(ma.status, 'ativa') = 'ativa' THEN 'active'
          ELSE 'inactive' 
        END as status,
        u.criado_em as created_at,
        u.deletado_em,
        NULL as last_login
      FROM users u
      LEFT JOIN matriculas_autorizadas ma ON ma.matricula = u.matricula
      WHERE u.deletado_em IS NULL
      ORDER BY u.criado_em DESC
    `;

    const result = await pool.query(query);

    res.status(200).json({
      success: true,
      usuarios: result.rows
    });

  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar usuários",
      error: error.message
    });
  }
};

// =========================
// 🔢 CONTAR ADMINS ATIVOS
// =========================
export const contarAdmins = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as total 
       FROM users 
       WHERE role = 'admin' AND deletado_em IS NULL`
    );

    res.status(200).json({
      success: true,
      total: parseInt(result.rows[0].total)
    });

  } catch (error) {
    console.error("Erro ao contar admins:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao contar administradores"
    });
  }
};

// =========================
// 🔐 VERIFICAR SENHA DO ADMIN
// =========================
export const verificarSenha = async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: "Usuário e senha são obrigatórios"
      });
    }

    const result = await pool.query(
      'SELECT senha_hash FROM users WHERE id = $1 AND deletado_em IS NULL',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado"
      });
    }

    const senhaValida = await bcrypt.compare(password, result.rows[0].senha_hash);

    res.status(200).json({
      success: true,
      valida: senhaValida
    });

  } catch (error) {
    console.error("Erro ao verificar senha:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao verificar senha"
    });
  }
};

// =========================
// ➕ CRIAR USUÁRIO
// =========================
export const criarUsuario = async (req, res) => {
  const client = await pool.connect();

  try {
    const { matricula, name, email, role, password, status = 'active' } = req.body;
    const adminId = req.user?.id;

    // Validações
    if (!matricula || !name || !email || !role || !password) {
      return res.status(400).json({
        success: false,
        message: "Todos os campos são obrigatórios"
      });
    }

    // Validar matrícula
    if (role === 'professor' && !/^\d{5}$/.test(matricula)) {
      return res.status(400).json({
        success: false,
        message: "Matrícula de professor deve ter 5 dígitos"
      });
    }

    if ((role === 'suporte' || role === 'admin') && !/^\d{13}$/.test(matricula)) {
      return res.status(400).json({
        success: false,
        message: "Matrícula de suporte/admin deve ter 13 dígitos"
      });
    }

    // Validar email
    if (!validarEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Email deve ser @fatec.sp.gov.br ou @proton.me"
      });
    }

    await client.query('BEGIN');

    // Converter status do frontend para o banco
    const statusMatricula = status === 'active' ? 'ativa' : 'inativa';

    // Verificar matrícula
    const checkMatricula = await client.query(
      'SELECT * FROM matriculas_autorizadas WHERE matricula = $1',
      [matricula]
    );

    if (checkMatricula.rows.length === 0) {
      await client.query(
        `INSERT INTO matriculas_autorizadas (matricula, role, status, nome_pre_cadastrado)
         VALUES ($1, $2, $3, $4)`,
        [matricula, role, statusMatricula, name]
      );
    } else {
      // Atualizar status se já existe
      await client.query(
        `UPDATE matriculas_autorizadas SET status = $1, role = $2 WHERE matricula = $3`,
        [statusMatricula, role, matricula]
      );
    }

    // Verificar duplicatas
    const checkUser = await client.query(
      'SELECT * FROM users WHERE matricula = $1 AND deletado_em IS NULL',
      [matricula]
    );

    if (checkUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: "Matrícula já cadastrada"
      });
    }

    const checkEmail = await client.query(
      'SELECT * FROM users WHERE email = $1 AND deletado_em IS NULL',
      [email]
    );

    if (checkEmail.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: "Email já cadastrado"
      });
    }

    // Criar usuário
    const senhaHash = await bcrypt.hash(password, 10);

    const result = await client.query(
      `INSERT INTO users (matricula, nome, email, senha_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, matricula, nome as name, email, role, criado_em as created_at`,
      [matricula, name, email, senhaHash, role]
    );

    // Registrar log
    await registrarAuditLog(client, adminId, result.rows[0].id, 'CRIAR_USER', {
      matricula,
      nome: name,
      email,
      role,
      status: statusMatricula
    }, req);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: "Usuário criado com sucesso",
      usuario: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Erro ao criar usuário:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar usuário",
      error: error.message
    });
  } finally {
    client.release();
  }
};

// =========================
// ✏️ ATUALIZAR USUÁRIO (CORRIGIDO - AGORA ATUALIZA STATUS CORRETAMENTE)
// =========================
export const atualizarUsuario = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { name, email, role, status, password } = req.body;
    const adminId = req.user?.id;

    console.log('📝 [UPDATE] Dados recebidos:', { id, name, email, role, status, password: !!password });

    // Validações
    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: "Nome, email e cargo são obrigatórios"
      });
    }

    if (!validarEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Email deve ser @fatec.sp.gov.br ou @proton.me"
      });
    }

    await client.query('BEGIN');

    // Buscar usuário
    const userCheck = await client.query(
      'SELECT * FROM users WHERE id = $1 AND deletado_em IS NULL',
      [id]
    );

    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado"
      });
    }

    const currentUser = userCheck.rows[0];

    // VALIDAÇÃO: Admin não pode mudar seu próprio role
    if (parseInt(id) === adminId && currentUser.role !== role) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: "Você não pode alterar seu próprio cargo. Peça a outro administrador."
      });
    }

    // VALIDAÇÃO: Proteger último admin
    if (currentUser.role === 'admin' && role !== 'admin') {
      const adminsCount = await client.query(
        `SELECT COUNT(*) as total FROM users WHERE role = 'admin' AND deletado_em IS NULL`
      );

      if (parseInt(adminsCount.rows[0].total) === 1) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          message: "Você é o único administrador. Promova outro usuário a admin antes de alterar seu cargo."
        });
      }
    }

    // Verificar email duplicado
    const emailCheck = await client.query(
      'SELECT * FROM users WHERE email = $1 AND id != $2 AND deletado_em IS NULL',
      [email, id]
    );

    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: "Email já cadastrado para outro usuário"
      });
    }

    // ✅ CORREÇÃO PRINCIPAL: Converter status e atualizar matriculas_autorizadas
    const statusMatricula = status === 'active' ? 'ativa' : 'inativa';

    console.log(`📝 [UPDATE] Atualizando matrícula ${currentUser.matricula}: role=${role}, status=${statusMatricula}`);

    // Primeiro verificar se a matrícula existe na tabela
    const matriculaExists = await client.query(
      'SELECT matricula FROM matriculas_autorizadas WHERE matricula = $1',
      [currentUser.matricula]
    );

    if (matriculaExists.rows.length === 0) {
      // Se não existir, criar
      await client.query(
        'INSERT INTO matriculas_autorizadas (matricula, role, status, nome_pre_cadastrado) VALUES ($1, $2, $3, $4)',
        [currentUser.matricula, role, statusMatricula, name]
      );
    } else {
      // Se existir, atualizar
      await client.query(
        'UPDATE matriculas_autorizadas SET role = $1, status = $2 WHERE matricula = $3',
        [role, statusMatricula, currentUser.matricula]
      );
    }

    // Verificar se a atualização funcionou
    const verificacao = await client.query(
      'SELECT status, role FROM matriculas_autorizadas WHERE matricula = $1',
      [currentUser.matricula]
    );

    console.log(`✅ [UPDATE] Status após update:`, verificacao.rows[0]);

    // Atualizar usuário na tabela users
    let updateQuery = `UPDATE users SET nome = $1, email = $2, role = $3`;
    let params = [name, email, role];

    if (password && password.trim() !== '') {
      const senhaHash = await bcrypt.hash(password, 10);
      updateQuery += `, senha_hash = $${params.length + 1} WHERE id = $${params.length + 2}`;
      params.push(senhaHash, id);
    } else {
      updateQuery += ` WHERE id = $${params.length + 1}`;
      params.push(id);
    }

    updateQuery += ` RETURNING id, matricula, nome as name, email, role, criado_em as created_at`;

    const result = await client.query(updateQuery, params);

    // Registrar log
    await registrarAuditLog(client, adminId, id, 'ATUALIZAR_USER', {
      alteracoes: {
        nome_antigo: currentUser.nome,
        nome_novo: name,
        role_antigo: currentUser.role,
        role_novo: role,
        status_novo: statusMatricula
      }
    }, req);

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: "Usuário atualizado com sucesso",
      usuario: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ [UPDATE] Erro ao atualizar usuário:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar usuário",
      error: error.message
    });
  } finally {
    client.release();
  }
};

// =========================
// 🗑️ DELETAR USUÁRIO
// =========================
export const deletarUsuario = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { senhaAdmin } = req.body;
    const adminId = req.user?.id;

    console.log('🗑️ [BACKEND] Deletar usuário:', { 
      usuarioId: id, 
      adminId, 
      temSenha: !!senhaAdmin 
    });

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Sessão inválida. Faça login novamente."
      });
    }

    await client.query('BEGIN');

    const userCheck = await client.query(
      'SELECT * FROM users WHERE id = $1 AND deletado_em IS NULL',
      [id]
    );

    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado"
      });
    }

    const usuario = userCheck.rows[0];

    // VALIDAÇÃO 1: Impedir que admin delete a si mesmo
    if (parseInt(id) === adminId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: "Você não pode excluir sua própria conta. Peça a outro administrador para fazer isso."
      });
    }

    // VALIDAÇÃO 2: Proteger último admin
    if (usuario.role === 'admin') {
      const adminsCount = await client.query(
        `SELECT COUNT(*) as total FROM users WHERE role = 'admin' AND deletado_em IS NULL`
      );

      if (parseInt(adminsCount.rows[0].total) === 1) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          message: "Este é o único administrador do sistema. Promova outro usuário antes de excluí-lo."
        });
      }
    }

    // VALIDAÇÃO 3: Verificar ordens em andamento (APENAS para suporte)
    if (usuario.role === 'suporte') {
      const ordensEmAndamento = await client.query(
        `SELECT id, codigo, titulo 
         FROM ordens 
         WHERE responsavel_id = $1 
         AND status = 'Em Andamento'`,
        [id]
      );

      if (ordensEmAndamento.rows.length > 0) {
        await client.query('ROLLBACK');

        const outrosSuporte = await client.query(
          `SELECT id, nome, matricula 
           FROM users 
           WHERE role = 'suporte' 
           AND id != $1 
           AND deletado_em IS NULL
           ORDER BY nome`,
          [id]
        );

        return res.status(409).json({
          success: false,
          requireReassignment: true,
          message: `Este usuário possui ${ordensEmAndamento.rows.length} ordem(ns) em andamento. Reatribua as ordens antes de excluir.`,
          ordens: ordensEmAndamento.rows.map(o => ({
            id: o.id,
            codigo: o.codigo,
            titulo: o.titulo
          })),
          suporteDisponiveis: outrosSuporte.rows.map(s => ({
            id: s.id,
            nome: s.nome,
            matricula: s.matricula
          }))
        });
      }
    }

    // VALIDAÇÃO 4: Confirmar senha para admin/suporte
    if (usuario.role === 'admin' || usuario.role === 'suporte') {
      if (!senhaAdmin || senhaAdmin.trim() === '') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          requirePasswordConfirmation: true,
          message: "Confirme sua senha para excluir este usuário"
        });
      }

      const adminCheck = await client.query(
        'SELECT senha_hash FROM users WHERE id = $1 AND deletado_em IS NULL',
        [adminId]
      );

      if (adminCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(401).json({
          success: false,
          message: "Sessão inválida. Faça login novamente."
        });
      }

      const senhaValida = await bcrypt.compare(senhaAdmin, adminCheck.rows[0].senha_hash);

      if (!senhaValida) {
        await client.query('ROLLBACK');
        return res.status(401).json({
          success: false,
          message: "Senha incorreta"
        });
      }
    }

    // REGISTRAR LOG ANTES DE DELETAR
    await registrarAuditLog(client, adminId, parseInt(id), 'DELETAR_USER', {
      usuario_deletado: {
        matricula: usuario.matricula,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role
      },
      tipo_exclusao: (usuario.role === 'professor') ? 'HARD_DELETE' : 'SOFT_DELETE'
    }, req);

    // EXECUTAR EXCLUSÃO
    let mensagem;

    if (usuario.role === 'suporte' || usuario.role === 'admin') {
      // SOFT DELETE
      await client.query(
        `UPDATE users 
         SET deletado_em = NOW(), deletado_por = $1, motivo_exclusao = $2 
         WHERE id = $3`,
        [adminId, 'Exclusão via painel admin', id]
      );

      await client.query(
        `UPDATE matriculas_autorizadas SET status = 'inativa' WHERE matricula = $1`,
        [usuario.matricula]
      );

      mensagem = `Usuário ${usuario.nome} foi excluído com sucesso.`;

    } else {
      // HARD DELETE para professor
      await client.query('DELETE FROM users WHERE id = $1', [id]);
      await client.query(
        'DELETE FROM matriculas_autorizadas WHERE matricula = $1', 
        [usuario.matricula]
      );

      mensagem = `Usuário ${usuario.nome} foi excluído com sucesso.`;
    }

    await client.query('COMMIT');
    console.log('✅ [BACKEND] Exclusão concluída com sucesso!');

    res.status(200).json({
      success: true,
      message: mensagem
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ [BACKEND] Erro ao deletar usuário:", error);

    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: "Não é possível excluir este usuário pois possui registros vinculados no sistema."
      });
    }

    res.status(500).json({
      success: false,
      message: "Erro ao deletar usuário",
      error: error.message
    });
  } finally {
    client.release();
  }
};

// =========================
// 📊 ESTATÍSTICAS
// =========================
export const estatisticasUsuarios = async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN role = 'professor' THEN 1 END) as professores,
        COUNT(CASE WHEN role = 'suporte' THEN 1 END) as suporte,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as administradores
      FROM users
      WHERE deletado_em IS NULL
    `;

    const result = await pool.query(query);

    res.status(200).json({
      success: true,
      estatisticas: result.rows[0]
    });

  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar estatísticas"
    });
  }
};

// =========================
// 🔍 BUSCAR POR ID
// =========================
export const buscarUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        u.id, 
        u.matricula, 
        u.nome as name, 
        u.email, 
        u.role, 
        u.criado_em as created_at,
        COALESCE(ma.status, 'ativa') as status_matricula
       FROM users u
       LEFT JOIN matriculas_autorizadas ma ON ma.matricula = u.matricula
       WHERE u.id = $1 AND u.deletado_em IS NULL`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado"
      });
    }

    res.status(200).json({
      success: true,
      usuario: result.rows[0]
    });

  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar usuário"
    });
  }
};