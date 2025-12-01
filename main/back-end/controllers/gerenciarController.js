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
// 🔧 Registrar log de auditoria (CORRIGIDO)
// =========================
async function registrarAuditLog(client, usuarioId, usuarioAfetadoId, acao, detalhes, req) {
  try {
    // ✅ CORREÇÃO: Verificar se o usuário afetado ainda existe antes de registrar
    const userExists = await client.query(
      'SELECT id FROM users WHERE id = $1',
      [usuarioAfetadoId]
    );

    // Se o usuário não existe mais (já foi deletado), não registrar o log com foreign key
    // Guardar o ID nos detalhes em vez de usar a coluna
    const finalUsuarioAfetadoId = userExists.rows.length > 0 ? usuarioAfetadoId : null;

    await client.query(
      `INSERT INTO audit_logs (usuario_id, usuario_afetado_id, acao, detalhes, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        usuarioId,
        finalUsuarioAfetadoId, // ← Null se usuário não existe mais
        acao,
        JSON.stringify({
          ...detalhes,
          usuario_afetado_id_original: usuarioAfetadoId // Guardar aqui para referência
        }),
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent']
      ]
    );
    console.log('✅ [AUDIT] Log registrado com sucesso');
  } catch (error) {
    console.error('❌ [AUDIT] Erro ao registrar audit log:', error.message);
    // Não lançar erro para não interromper a operação principal
  }
}
// =========================
// 📋 LISTAR USUÁRIOS ATIVOS (COM SOFT DELETE)
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
        CASE WHEN u.deletado_em IS NULL THEN 'active' ELSE 'inactive' END as status,
        u.criado_em as created_at,
        u.deletado_em,
        NULL as last_login
      FROM users u
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
    const { matricula, name, email, role, password } = req.body;
    const adminId = req.user?.id; // ID do admin que está criando

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

    // Verificar matrícula
    const checkMatricula = await client.query(
      'SELECT * FROM matriculas_autorizadas WHERE matricula = $1',
      [matricula]
    );

    if (checkMatricula.rows.length === 0) {
      await client.query(
        `INSERT INTO matriculas_autorizadas (matricula, role, status, nome_pre_cadastrado)
         VALUES ($1, $2, 'ativa', $3)`,
        [matricula, role, name]
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
      role
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
// ✏️ ATUALIZAR USUÁRIO
// =========================
export const atualizarUsuario = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;
    const adminId = req.user?.id;

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

    // ✅ VALIDAÇÃO: Admin não pode mudar seu próprio role
    if (parseInt(id) === adminId && currentUser.role !== role) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: "Você não pode alterar seu próprio cargo. Peça a outro administrador."
      });
    }

    // ✅ VALIDAÇÃO: Proteger último admin
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

    // Atualizar role na matrícula autorizada se mudou
    if (currentUser.role !== role) {
      await client.query(
        'UPDATE matriculas_autorizadas SET role = $1 WHERE matricula = $2',
        [role, currentUser.matricula]
      );
    }

    // Atualizar usuário
    let updateQuery = `UPDATE users SET nome = $1, email = $2, role = $3`;
    let params = [name, email, role];

    if (password && password.trim() !== '') {
      const senhaHash = await bcrypt.hash(password, 10);
      updateQuery += `, senha_hash = $4 WHERE id = $5`;
      params.push(senhaHash, id);
    } else {
      updateQuery += ` WHERE id = $4`;
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
        role_novo: role
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
    console.error("Erro ao atualizar usuário:", error);
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
// 🗑️ DELETAR USUÁRIO (CORRIGIDO)
// =========================
export const deletarUsuario = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { senhaAdmin } = req.body;
    const adminId = req.user?.id; // Token usa 'id'

    console.log('🗑️ [BACKEND] Deletar usuário:', { 
      usuarioId: id, 
      adminId, 
      adminRole: req.user?.role,
      temSenha: !!senhaAdmin 
    });

    if (!adminId) {
      console.error('❌ [BACKEND] req.user não definido ou sem id');
      return res.status(401).json({
        success: false,
        message: "Sessão inválida. Faça login novamente."
      });
    }

    await client.query('BEGIN');

    // 1️⃣ Buscar usuário que será deletado
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
    console.log('🗑️ [BACKEND] Usuário alvo:', { 
      id: usuario.id,
      nome: usuario.nome, 
      role: usuario.role 
    });

    // 2️⃣ VALIDAÇÃO: Não pode deletar a si mesmo se for o último admin
    if (parseInt(id) === adminId && usuario.role === 'admin') {
      const adminsCount = await client.query(
        `SELECT COUNT(*) as total FROM users WHERE role = 'admin' AND deletado_em IS NULL`
      );

      if (parseInt(adminsCount.rows[0].total) === 1) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          message: "Você é o único administrador. Promova outro usuário antes de se excluir."
        });
      }
    }

    // 3️⃣ VALIDAÇÃO DE SENHA: Sempre obrigatória para admin/suporte
    if (usuario.role === 'admin' || usuario.role === 'suporte') {
      console.log('🔐 [BACKEND] Usuário é admin/suporte, validando senha...');

      if (!senhaAdmin || senhaAdmin.trim() === '') {
        await client.query('ROLLBACK');
        console.log('⚠️ [BACKEND] Senha não fornecida');
        return res.status(400).json({
          success: false,
          requirePasswordConfirmation: true,
          message: "Confirme sua senha para excluir este usuário"
        });
      }

      // 🔍 Buscar senha do ADMIN LOGADO (não do usuário sendo deletado!)
      console.log('🔍 [BACKEND] Buscando senha do admin logado (ID:', adminId, ')');

      const adminCheck = await client.query(
        'SELECT id, senha_hash FROM users WHERE id = $1 AND deletado_em IS NULL',
        [adminId]
      );

      console.log('🔍 [BACKEND] Resultado da busca:', {
        encontrado: adminCheck.rows.length > 0,
        adminId: adminCheck.rows[0]?.id
      });

      if (adminCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        console.log('❌ [BACKEND] Admin logado não encontrado no banco');
        return res.status(401).json({
          success: false,
          message: "Sessão inválida. Faça login novamente."
        });
      }

      const adminSenhaHash = adminCheck.rows[0].senha_hash;

      if (!adminSenhaHash) {
        await client.query('ROLLBACK');
        console.log('❌ [BACKEND] senha_hash está null/undefined');
        return res.status(500).json({
          success: false,
          message: "Erro de integridade de dados. Contate o suporte."
        });
      }

      console.log('🔐 [BACKEND] Comparando senhas...');
      const senhaValida = await bcrypt.compare(senhaAdmin, adminSenhaHash);

      if (!senhaValida) {
        await client.query('ROLLBACK');
        console.log('❌ [BACKEND] Senha incorreta');
        return res.status(401).json({
          success: false,
          message: "Senha incorreta"
        });
      }

      console.log('✅ [BACKEND] Senha confirmada!');
    }

    // 4️⃣ REGISTRAR LOG ANTES DE DELETAR
    console.log('📝 [BACKEND] Registrando audit log...');
    await registrarAuditLog(client, adminId, parseInt(id), 'DELETAR_USER', {
      usuario_deletado: {
        matricula: usuario.matricula,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role
      },
      tipo_exclusao: (usuario.role === 'professor') ? 'HARD_DELETE' : 'SOFT_DELETE'
    }, req);

    // 5️⃣ EXECUTAR EXCLUSÃO
    let mensagem;

    if (usuario.role === 'suporte' || usuario.role === 'admin') {
      // SOFT DELETE
      console.log('🔄 [BACKEND] Aplicando SOFT DELETE...');
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

      mensagem = `Usuário ${usuario.role} desativado com sucesso. Histórico mantido.`;

    } else {
      // HARD DELETE
      console.log('🔄 [BACKEND] Aplicando HARD DELETE...');
      await client.query('DELETE FROM users WHERE id = $1', [id]);
      await client.query(
        'DELETE FROM matriculas_autorizadas WHERE matricula = $1', 
        [usuario.matricula]
      );

      mensagem = "Usuário professor excluído permanentemente.";
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
    console.error("❌ [BACKEND] Stack trace:", error.stack);

    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: "Não é possível excluir usuário com ordens de serviço vinculadas"
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
      `SELECT id, matricula, nome as name, email, role, criado_em as created_at
       FROM users 
       WHERE id = $1 AND deletado_em IS NULL`,
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

