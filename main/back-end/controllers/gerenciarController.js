import pool from "../config/db.js";
import bcrypt from "bcrypt";

// =========================
// 📋 LISTAR TODOS OS USUÁRIOS
// =========================
export const listarUsuarios = async (req, res) => {
  try {
    console.log('🔍 [BACKEND] Requisição recebida em /api/admin/usuarios');
    console.log('🔍 [BACKEND] Headers:', req.headers);
    console.log('🔍 [BACKEND] Token presente?', req.headers.authorization ? 'Sim' : 'Não');

    const query = `
      SELECT 
        u.id,
        u.matricula,
        u.nome as name,
        u.email,
        u.role,
        'active' as status,
        u.criado_em as created_at,
        NULL as last_login
      FROM users u
      ORDER BY u.criado_em DESC
    `;

    console.log('🔍 [BACKEND] Executando query...');
    const result = await pool.query(query);
    console.log(`✅ [BACKEND] ${result.rows.length} usuários encontrados`);

    res.status(200).json({
      success: true,
      usuarios: result.rows
    });

  } catch (error) {
    console.error("❌ [BACKEND] Erro ao listar usuários:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar usuários",
      error: error.message
    });
  }
};

// =========================
// 🔍 BUSCAR USUÁRIO POR ID
// =========================
export const buscarUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        u.id,
        u.matricula,
        u.nome as name,
        u.email,
        u.role,
        'active' as status,
        u.criado_em as created_at,
        NULL as last_login
      FROM users u
      WHERE u.id = $1
    `;

    const result = await pool.query(query, [id]);

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
      message: "Erro ao buscar usuário",
      error: error.message
    });
  }
};

// =========================
// ➕ CRIAR NOVO USUÁRIO
// =========================
export const criarUsuario = async (req, res) => {
  const client = await pool.connect();

  try {
    const { matricula, name, email, role, password } = req.body;

    // Validações básicas
    if (!matricula || !name || !email || !role || !password) {
      return res.status(400).json({
        success: false,
        message: "Todos os campos são obrigatórios"
      });
    }

    // Validar formato de matrícula (5 dígitos para professor, 13 para suporte/admin)
    if (role === 'professor') {
      if (!/^\d{5}$/.test(matricula)) {
        return res.status(400).json({
          success: false,
          message: "Matrícula de professor deve ter exatamente 5 dígitos"
        });
      }
    } else {
      if (!/^\d{13}$/.test(matricula)) {
        return res.status(400).json({
          success: false,
          message: "Matrícula de suporte/admin deve ter exatamente 13 dígitos"
        });
      }
    }

    // Validar email institucional
    if (!email.endsWith('@fatec.sp.gov.br')) {
      return res.status(400).json({
        success: false,
        message: "Email deve ser institucional (@fatec.sp.gov.br)"
      });
    }

    // Validar role
    if (!['professor', 'suporte', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Cargo inválido"
      });
    }

    await client.query('BEGIN');

    // Verificar se matrícula existe em matriculas_autorizadas
    const checkMatricula = await client.query(
      'SELECT * FROM matriculas_autorizadas WHERE matricula = $1',
      [matricula]
    );

    if (checkMatricula.rows.length === 0) {
      // Se não existir, criar entrada em matriculas_autorizadas
      await client.query(
        `INSERT INTO matriculas_autorizadas (matricula, role, status, nome_pre_cadastrado)
         VALUES ($1, $2, 'ativa', $3)`,
        [matricula, role, name]
      );
    } else {
      // Se existir, verificar se já tem usuário vinculado
      const checkUser = await client.query(
        'SELECT * FROM users WHERE matricula = $1',
        [matricula]
      );

      if (checkUser.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          message: "Já existe um usuário cadastrado com esta matrícula"
        });
      }

      // Atualizar role na matrícula autorizada se for diferente
      if (checkMatricula.rows[0].role !== role) {
        await client.query(
          'UPDATE matriculas_autorizadas SET role = $1 WHERE matricula = $2',
          [role, matricula]
        );
      }
    }

    // Verificar se email já existe
    const checkEmail = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (checkEmail.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: "Email já cadastrado"
      });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(password, 10);

    // Inserir usuário
    const insertQuery = `
      INSERT INTO users (matricula, nome, email, senha_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, matricula, nome as name, email, role, criado_em as created_at
    `;

    const result = await client.query(insertQuery, [
      matricula,
      name,
      email,
      senhaHash,
      role
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: "Usuário criado com sucesso",
      usuario: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Erro ao criar usuário:", error);

    // Tratamento de erros específicos do PostgreSQL
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        message: "Matrícula ou email já cadastrado"
      });
    }

    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({
        success: false,
        message: "Matrícula não autorizada no sistema"
      });
    }

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
    const { name, email, role, status, password } = req.body;

    // Validações básicas
    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: "Nome, email e cargo são obrigatórios"
      });
    }

    // Validar email institucional
    if (!email.endsWith('@fatec.sp.gov.br')) {
      return res.status(400).json({
        success: false,
        message: "Email deve ser institucional (@fatec.sp.gov.br)"
      });
    }

    // Validar role
    if (!['professor', 'suporte', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Cargo inválido"
      });
    }

    await client.query('BEGIN');

    // Buscar usuário atual
    const userCheck = await client.query(
      'SELECT * FROM users WHERE id = $1',
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

    // Verificar se email já existe em outro usuário
    const emailCheck = await client.query(
      'SELECT * FROM users WHERE email = $1 AND id != $2',
      [email, id]
    );

    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: "Email já cadastrado para outro usuário"
      });
    }

    // Atualizar role na tabela matriculas_autorizadas se mudou
    if (currentUser.role !== role) {
      await client.query(
        'UPDATE matriculas_autorizadas SET role = $1 WHERE matricula = $2',
        [role, currentUser.matricula]
      );
    }

    // Preparar query de atualização
    let updateQuery = `
      UPDATE users 
      SET nome = $1, email = $2, role = $3
    `;
    let params = [name, email, role];

    // Se senha foi fornecida, incluir no update
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
// 🗑️ DELETAR USUÁRIO
// =========================
export const deletarUsuario = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Buscar matrícula do usuário
    const userCheck = await client.query(
      'SELECT matricula FROM users WHERE id = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado"
      });
    }

    const matricula = userCheck.rows[0].matricula;

    // IMPORTANTE: Deletar na ordem correta
    // 1º Deletar matrícula autorizada (remove a constraint)
    await client.query('DELETE FROM matriculas_autorizadas WHERE matricula = $1', [matricula]);

    // 2º Deletar usuário
    await client.query('DELETE FROM users WHERE id = $1', [id]);

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: "Usuário e matrícula excluídos com sucesso"
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Erro ao deletar usuário:", error);
    console.error("❌ Código do erro:", error.code);

    // Tratamento de erro de constraint (se houver ordens vinculadas, etc)
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: "Não é possível excluir usuário com registros vinculados no sistema (ordens de serviço, patrimônios, etc)"
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
// 📊 ESTATÍSTICAS DE USUÁRIOS
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
      message: "Erro ao buscar estatísticas",
      error: error.message
    });
  }
};