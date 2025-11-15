import pool from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";

// === 1. DEFINIÇÃO DE CAMINHOS ABSOLUTOS ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // .../main/back-end/controllers
const BACKEND_ROOT = path.join(__dirname, '..'); // .../main/back-end

// ==========================================

/**
 * ==========================================
 * 📸 ATUALIZAR / ENVIAR FOTO DE PERFIL
 * ==========================================
 */
/**
 * ==========================================
 * 📸 ATUALIZAR / ENVIAR FOTO DE PERFIL (CORRIGIDA)
 * ==========================================
 */
export const atualizarFotoPerfil = async (req, res) => {
  try {
    const userId = req.user.id; 
    const fotoPath = `/uploads/perfis/${req.file.filename}`;

    // 1️⃣ Busca a imagem anterior ativa
    // ... (o código do banco é o mesmo)
    const oldImagesResult = await pool.query(
      "SELECT caminho_arquivo FROM imagens_perfil WHERE usuario_id = $1 AND ativo = TRUE",
      [userId]
    );
    const oldImages = oldImagesResult.rows;

    // 2️⃣ Desativa imagens antigas
    await pool.query("UPDATE imagens_perfil SET ativo = FALSE WHERE usuario_id = $1", [userId]);

    // 3️⃣ Insere a nova imagem no banco
    await pool.query(
      "INSERT INTO imagens_perfil (usuario_id, caminho_arquivo, ativo) VALUES ($1, $2, TRUE)",
      [userId, fotoPath]
    );

    // 4️⃣ Remove o arquivo antigo do disco (AGORA CORRIGIDO)
    if (oldImages.length > 0) {
      const dbPath = oldImages[0].caminho_arquivo;
      // Remove a barra inicial (/) e junta com a raiz do backend
      const oldFile = path.join(BACKEND_ROOT, dbPath.substring(1)); // CORREÇÃO APLICADA AQUI

      fs.unlink(oldFile, (err) => {
        if (err) console.warn("⚠️ Não foi possível excluir a imagem antiga:", err.message);
      });
    }

    res.json({
      success: true,
      message: "Foto de perfil atualizada com sucesso!",
      fotoUrl: fotoPath,
    });
  } catch (err) {
    console.error("❌ Erro ao salvar foto de perfil:", err);
    res.status(500).json({ success: false, message: "Erro interno no servidor." });
  }
};

/**
 * ==========================================
 * 🧠 OBTER FOTO DE PERFIL DO USUÁRIO
 * ==========================================
 */
export const obterFotoPerfil = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT caminho_arquivo FROM imagens_perfil WHERE usuario_id = $1 AND ativo = TRUE LIMIT 1",
      [req.user.id]
    );

    const rows = result.rows;

    if (rows.length === 0) {
      return res.json({ fotoUrl: "/uploads/perfis/default-avatar.png" });
    }

    res.json({ fotoUrl: rows[0].caminho_arquivo });
  } catch (err) {
    console.error("❌ Erro ao buscar foto de perfil:", err);
    res.status(500).json({ message: "Erro ao buscar foto de perfil." });
  }
};

/**
 * ==========================================
 * 🗑️ REMOVER FOTO DE PERFIL
 * ==========================================
 */

/**
 * ==========================================
 * 🗑️ REMOVER FOTO DE PERFIL (CORRIGIDA - AGORA COM BACKEND_ROOT DEFINIDO)
 * ==========================================
 */
export const removerFotoPerfil = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT caminho_arquivo FROM imagens_perfil WHERE usuario_id = $1 AND ativo = TRUE",
      [userId]
    );
    const rows = result.rows;

    await pool.query("UPDATE imagens_perfil SET ativo = FALSE WHERE usuario_id = $1", [userId]);

    if (rows.length > 0) {
      const dbPath = rows[0].caminho_arquivo;

      // **A CORREÇÃO AGORA FUNCIONA** porque BACKEND_ROOT está definido no topo.
      const filePath = path.join(BACKEND_ROOT, dbPath.substring(1));

      fs.unlink(filePath, (err) => {
        if (err) {
          console.warn("⚠️ Não foi possível excluir a imagem:", err.message);
          console.warn("Caminho de exclusão tentado:", filePath);
        }
      });
    }

    res.json({ success: true, message: "Foto de perfil removida com sucesso!" });
  } catch (err) {
    console.error("❌ Erro ao remover foto de perfil:", err);
    res.status(500).json({ success: false, message: "Erro ao remover foto." });
  }
};

// ==========================================
// 🔐 ALTERAR SENHA DO USUÁRIO LOGADO
// ==========================================
export const alterarSenha = async (req, res) => {
  try {
    const userId = req.user.id;
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ success: false, message: "Campos obrigatórios não enviados." });
    }

    // 1️⃣ Busca a senha hash atual do banco
    const result = await pool.query("SELECT senha_hash FROM users WHERE id = $1", [userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Usuário não encontrado." });
    }

    const senhaHashAtual = result.rows[0].senha_hash;

    // 2️⃣ Verifica se a senha atual está correta
    const senhaConfere = await bcrypt.compare(senhaAtual, senhaHashAtual);
    if (!senhaConfere) {
      return res.status(401).json({ success: false, message: "Senha atual incorreta." });
    }

    // 3️⃣ Gera hash da nova senha
    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

    // 4️⃣ Atualiza no banco
    await pool.query("UPDATE users SET senha_hash = $1 WHERE id = $2", [novaSenhaHash, userId]);

    res.json({ success: true, message: "Senha alterada com sucesso!" });
  } catch (err) {
    console.error("❌ Erro ao alterar senha:", err);
    res.status(500).json({ success: false, message: "Erro interno no servidor." });
  }
};
