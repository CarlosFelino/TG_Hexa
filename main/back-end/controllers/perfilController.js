import  pool  from '../config/db.js';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET dados do usuário
export const getUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            'SELECT id, nome, email, matricula, role, foto_perfil FROM users WHERE id=$1',
            [userId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST upload da foto
export const uploadPhoto = async (req, res) => {
    try {
        const userId = req.user.id;
        const photoPath = `/uploads/pic_profile/${req.file.filename}`;
        await pool.query('UPDATE users SET foto_perfil=$1 WHERE id=$2', [photoPath, userId]);
        res.json({ success: true, photo: photoPath });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE remover foto
export const removePhoto = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query('SELECT foto_perfil FROM users WHERE id=$1', [userId]);
        const foto = result.rows[0].foto_perfil;

        if (foto && !foto.includes('default-avatar.png')) {
            fs.unlinkSync(path.join(__dirname, '..', foto));
        }

        await pool.query('UPDATE users SET foto_perfil=NULL WHERE id=$1', [userId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST alterar senha
export const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        const result = await pool.query('SELECT senha_hash FROM users WHERE id=$1', [userId]);
        const user = result.rows[0];

        const match = await bcrypt.compare(currentPassword, user.senha_hash);
        if (!match) return res.status(400).json({ error: 'Senha atual incorreta' });

        const newHash = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET senha_hash=$1 WHERE id=$2', [newHash, userId]);
        await pool.query('INSERT INTO alterarSenha(user_id, metodo) VALUES($1, $2)', [userId, 'perfil']);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
