import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { enviarEmailRedefinirSenha } from "../services/mailerService.js";

// -------------------
// Cadastro
// -------------------
export async function cadastrarUsuario(req, res) {
  const { nome, email, senha, matricula } = req.body;
  try {
    // Busca a matrícula autorizada
    const matriculaResult = await pool.query(
      "SELECT * FROM matriculas_autorizadas WHERE matricula = $1 AND status = 'ativa'",
      [matricula]
    );

    if (matriculaResult.rows.length === 0) {
      return res.status(400).json({ erro: "Matrícula inválida ou inativa" });
    }

    const matriculaData = matriculaResult.rows[0];
    const nomePrecadastrado = matriculaData.nome_pre_cadastrado;

    // Valida se o nome fornecido corresponde ao nome pré-cadastrado
    // Remove espaços extras e compara ignorando maiúsculas/minúsculas
    const nomeNormalizado = nome.trim().toLowerCase();
    const nomePrecadastradoNormalizado = nomePrecadastrado.trim().toLowerCase();

    if (nomeNormalizado !== nomePrecadastradoNormalizado) {
      return res.status(400).json({ 
        erro: "Nome não corresponde ao cadastrado para esta matrícula",
        nomeCadastrado: nomePrecadastrado 
      });
    }

    const role = matriculaData.role;
    const senhaHash = await bcrypt.hash(senha, 10);

    const userResult = await pool.query(
      `INSERT INTO users (nome, email, senha_hash, matricula, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, email, matricula, role`,
      [nome, email, senhaHash, matricula, role]
    );

    res.status(201).json(userResult.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.message.includes("duplicate key")) {
      return res.status(400).json({ erro: "Email ou matrícula já cadastrados" });
    }
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
}

// -------------------
// ✅ LOGIN CORRIGIDO - COM VERIFICAÇÃO DE STATUS
// -------------------
export async function login(req, res) {
  const { email, senha } = req.body;
  try {
    console.log(`🔐 [LOGIN] Tentativa de login para: ${email}`);

    // 1️⃣ Buscar usuário (verificar soft delete)
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND deletado_em IS NULL", 
      [email]
    );

    if (result.rows.length === 0) {
      console.log(`❌ [LOGIN] Usuário não encontrado: ${email}`);
      return res.status(401).json({ erro: "Usuário não encontrado" });
    }

    const user = result.rows[0];

    // 2️⃣ Verificar status da matrícula
    const matriculaCheck = await pool.query(
      "SELECT status FROM matriculas_autorizadas WHERE matricula = $1",
      [user.matricula]
    );

    if (matriculaCheck.rows.length === 0) {
      console.log(`❌ [LOGIN] Matrícula não encontrada: ${user.matricula}`);
      return res.status(401).json({ 
        erro: "Matrícula não autorizada. Entre em contato com a administração." 
      });
    }

    const statusMatricula = matriculaCheck.rows[0].status;
    console.log(`📋 [LOGIN] Status da matrícula ${user.matricula}: ${statusMatricula}`);

    // 3️⃣ VALIDAÇÃO CRÍTICA: Verificar se a matrícula está ativa
    if (statusMatricula !== 'ativa') {
      console.log(`🚫 [LOGIN] Acesso negado - Matrícula inativa: ${user.matricula}`);
      return res.status(403).json({ 
        erro: "Sua conta está inativa. Entre em contato com a administração para mais informações." 
      });
    }

    // 4️⃣ Verificar senha
    const senhaValida = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaValida) {
      console.log(`❌ [LOGIN] Senha incorreta para: ${email}`);
      return res.status(401).json({ erro: "Senha incorreta" });
    }

    // 5️⃣ Gerar token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, nome: user.nome },
      "segredo123",
      { expiresIn: "1h" }
    );

    console.log(`✅ [LOGIN] Login bem-sucedido: ${user.nome} (${user.role})`);

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        nome: user.nome, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (err) {
    console.error('❌ [LOGIN] Erro no servidor:', err);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
}

// -------------------
// Recuperar senha
// -------------------
export async function recuperarSenha(req, res) {
  const { email } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ erro: "Usuário não encontrado" });
    }

    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000); // expira em 1 hora
    const usado = false;

    await pool.query(
      `INSERT INTO resetSenha (user_id, token, expira_em, usado)
       VALUES ($1, $2, $3, $4)`,
      [user.id, token, expiraEm, usado]
    );

    await enviarEmailRedefinirSenha(user.nome, user.email, token);
    res.json({ mensagem: "Email de recuperação enviado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
}

// -------------------
// Redefinir senha
// -------------------
export async function redefinirSenha(req, res) {
  const { token, novaSenha } = req.body;
  try {
    const result = await pool.query("SELECT * FROM resetSenha WHERE token = $1", [token]);
    if (result.rows.length === 0) {
      return res.status(400).json({ erro: "Token inválido ou expirado" });
    }

    const userId = result.rows[0].user_id;
    const senhaHash = await bcrypt.hash(novaSenha, 10);

    await pool.query("UPDATE users SET senha_hash = $1 WHERE id = $2", [senhaHash, userId]);
    await pool.query("DELETE FROM resetSenha WHERE token = $1", [token]);

    res.json({ mensagem: "Senha redefinida com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
}