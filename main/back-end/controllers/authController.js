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
    const matriculaResult = await pool.query(
      "SELECT * FROM matriculas_autorizadas WHERE matricula = $1 AND status = 'ativa'",
      [matricula]
    );

    if (matriculaResult.rows.length === 0) {
      return res.status(400).json({ erro: "Matrícula inválida ou inativa" });
    }

    const role = matriculaResult.rows[0].role;
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
// Login
// -------------------
export async function login(req, res) {
  const { email, senha } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ erro: "Usuário não encontrado" });
    }

    const user = result.rows[0];
    const senhaValida = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ erro: "Senha incorreta" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      "segredo123",
      { expiresIn: "1h" }
    );

    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
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

    await pool.query(
      "INSERT INTO resetSenha (user_id, token) VALUES ($1, $2)",
      [user.id, token]
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