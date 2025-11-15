import pool from "../config/db.js";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween.js";
import fs from "fs";
import path from "path";

dayjs.extend(isBetween);

/* ===========================================================
    Função auxiliar: atualizar status, prioridade e alertas
=========================================================== */
    export async function atualizarOrdens(ordens, dataReferencia = dayjs()) {
        const hoje = dataReferencia; // usa a data simulada se for passada

    for (let ordem of ordens) {
        if (!ordem.data_limite) {
            console.warn(`Ordem ID ${ordem.id} não possui data_limite. Pulando atualização.`);
            continue;
        }

        const prazo = dayjs(ordem.data_limite);
        if (!prazo.isValid()) {
            console.warn(`Data limite inválida para Ordem ID ${ordem.id}. Pulando.`);
            continue;
        }

        try {
            let statusAtualizado = false;
            if (ordem.status !== "Concluída" && ordem.status !== "Não Concluída" && hoje.isAfter(prazo)) {
                await pool.query(
                    "UPDATE ordens SET status = 'Não Concluída' WHERE id = $1",
                    [ordem.id]
                );
                ordem.status = "Não Concluída";
                statusAtualizado = true;
            }

            // Calcular dias úteis restantes
            let faltando = 0;
            let temp = hoje.clone();
            while (temp.isBefore(prazo, "day")) {
                temp = temp.add(1, "day");
                if (temp.day() !== 0 && temp.day() !== 6) faltando++;
            }

            // Definir prioridade
            let prioridade = 1;
            if (faltando <= 1) prioridade = 5;
            else if (faltando === 2) prioridade = 4;
            else if (faltando === 3) prioridade = 3;
            else if (faltando === 4) prioridade = 2;
            ordem.prioridade = prioridade;

            // Atualiza prioridade se mudou
            if (ordem.prioridade !== prioridade || statusAtualizado) {
                await pool.query(
                    "UPDATE ordens SET prioridade = $1 WHERE id = $2",
                    [prioridade, ordem.id]
                );
            }

            ordem.alerta_prazo = faltando <= 3 &&
                                 ordem.status !== "Concluída" &&
                                 ordem.status !== "Não Concluída";

            // Após calcular ordem.alerta_prazo
            if (ordem.alerta_prazo) {
              await pool.query(
                `INSERT INTO ordens_alertas (ordem_id, tipo_alerta)
                 VALUES ($1, 'prazo')
                 ON CONFLICT DO NOTHING`,
                [ordem.id]
              );
            } else {
              // Se não está mais em alerta, marcar como resolvido
              await pool.query(
                `UPDATE ordens_alertas
                 SET ativo = false, resolvido_em = NOW()
                 WHERE ordem_id = $1 AND tipo_alerta = 'prazo' AND ativo = true`,
                [ordem.id]
              );
            }

            

        } catch (error) {
            console.error(`Erro ao atualizar Ordem ID ${ordem.id}:`, error);
            throw error;
        }
    }
}

/* ===========================================================
    Criar nova ordem (com suporte a anexos)
=========================================================== */
export async function criarOrdem(req, res) {
    console.log("===== DEBUG REQ =====");
    console.log("REQ.BODY:", req.body);
    console.log("REQ.FILES:", req.files);
    console.log("REQ.USER:", req.user);

    const criadorId = req.user?.id;
    const status = "Pendente";
    let client;

    try {
        const {
            tipo_solicitacao = "",
            local_tipo = "",
            local_detalhe = "",
            descricao = "",
            observacoes = "",
            equipamento = "",
            tipo_problema = "",
            app_nome = "",
            app_versao = "",
            app_link = "",
        } = req.body || {};

        if (!criadorId || !tipo_solicitacao || !local_tipo || !local_detalhe) {
            return res.status(400).json({ erro: "Dados obrigatórios não fornecidos." });
        }

        if (tipo_solicitacao === 'instalacao' && !app_nome) {
            return res.status(400).json({ erro: "Nome do aplicativo é obrigatório para instalação." });
        }

        let desc = descricao || "Sem descrição";
        const titulo = tipo_solicitacao === 'problema'
            ? `${local_detalhe} - ${equipamento || 'Outro Equipamento'}`
            : `${local_detalhe} - ${app_nome}`;

        client = await pool.connect();
        await client.query("BEGIN");

        const seq = await client.query("SELECT nextval('ordens_id_seq') AS next_id");
        const ordemId = seq.rows[0].next_id;
        const ano = new Date().getFullYear();
        const codigoGerado = `#ORD-${ano}-${String(ordemId).padStart(3, "0")}`;

        await client.query(
            `INSERT INTO ordens
            (id, codigo, titulo, descricao, status, criador_id, tipo_solicitacao, local_tipo, local_detalhe, observacoes)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [ordemId, codigoGerado, titulo, desc, status, criadorId, tipo_solicitacao, local_tipo, local_detalhe, observacoes || null]
        );

        if (tipo_solicitacao === "problema") {
            await client.query(
                `INSERT INTO ordens_problemas (ordem_id, equipamento, tipo_problema)
                 VALUES ($1,$2,$3)`,
                [ordemId, equipamento || "Outro Equipamento", tipo_problema || "Outro"]
            );
        } else if (tipo_solicitacao === "instalacao") {
            await client.query(
                `INSERT INTO ordens_instalacoes (ordem_id, app_nome, app_versao, app_link)
                 VALUES ($1,$2,$3,$4)`,
                [ordemId, app_nome, app_versao || null, app_link || null]
            );
        }

        if (req.files && req.files.length > 0) {
            const filePath = path.join(path.resolve("main/back-end/uploads"), String(ordemId));
            fs.mkdirSync(filePath, { recursive: true });

            for (let file of req.files) {
                const destino = path.join(filePath, file.originalname);
                fs.renameSync(file.path, destino);
                await client.query(
                  `INSERT INTO ordens_anexos (ordem_id, arquivo_nome, arquivo_url)
                   VALUES ($1, $2, $3)`,
                  [ordemId, file.originalname, destino]
                );
            }
        }

        await client.query("COMMIT");
        res.status(201).json({
            mensagem: "Ordem criada com sucesso",
            ordem: { id: ordemId, codigo: codigoGerado },
        });
    } catch (err) {
        if (client) await client.query("ROLLBACK");
        console.error("Erro ao criar ordem:", err);
        res.status(500).json({ erro: "Erro ao criar ordem", debug: err.message });
    } finally {
        if (client) client.release();
    }
}

/* ===========================================================
    Listar ordens (professor/suporte)
=========================================================== */
export async function listarOrdens(req, res) {
    try {
        const { id, role: tipo } = req.user || {};
        console.log("=== DEBUG listarOrdens ===", { id, tipo });

        if (!id || (tipo !== "professor" && tipo !== "suporte")) {
            return res.status(403).json({ erro: "Usuário inválido ou não autenticado" });
        }

        const baseQuery = `
            SELECT 
                o.id, o.codigo, o.data_criacao, o.titulo, o.descricao,
                o.local_detalhe, o.tipo_solicitacao, o.status, o.avaliacao,
                o.responsavel_id, o.data_limite, 
                p.equipamento, p.tipo_problema,
                i.app_nome, i.app_versao, i.app_link,
                u.nome AS tecnico_nome
            FROM ordens o
            LEFT JOIN ordens_problemas p ON p.ordem_id = o.id
            LEFT JOIN ordens_instalacoes i ON i.ordem_id = o.id
            LEFT JOIN users u ON u.id = o.responsavel_id
        `;

        let result;
        if (tipo === "professor") {
            result = await pool.query(`${baseQuery} WHERE o.criador_id = $1 ORDER BY o.data_criacao DESC`, [id]);
        } else {
            result = await pool.query(`${baseQuery} ORDER BY o.data_criacao DESC`);
        }

        const ordens = result.rows;
        await atualizarOrdens(ordens);

        res.json(ordens);
    } catch (err) {
        console.error("Erro ao listar ordens:", err);
        res.status(500).json({ erro: "Erro ao listar ordens" });
    }
}

/* ===========================================================
    Listar ordens detalhadas (somente suporte/admin)
=========================================================== */
export async function listarOrdensDetalhadas(req, res) {
    try {
        const { id, role: tipo } = req.user || {};
        console.log("=== DEBUG listarOrdensDetalhadas ===", { id, tipo });

        if (!id || (tipo !== "suporte" && tipo !== "admin")) {
            return res.status(403).json({ erro: "Acesso negado: apenas suporte ou admin podem visualizar" });
        }

        const baseQuery = `
            SELECT 
                o.id, 
                o.codigo, 
                o.data_criacao, 
                o.titulo, 
                o.descricao,
                o.local_tipo,
                o.local_detalhe, 
                o.tipo_solicitacao, 
                o.status, 
                o.avaliacao,
                o.responsavel_id, 
                o.criador_id,
                o.data_limite,
                o.solucao,
                o.observacoes,
                p.equipamento, 
                p.tipo_problema,
                i.app_nome, 
                i.app_versao, 
                i.app_link,
                uc.nome AS criador_nome,           -- Nome do professor que abriu
                ur.nome AS responsavel_nome        -- Nome do técnico responsável
            FROM ordens o
            LEFT JOIN ordens_problemas p ON p.ordem_id = o.id
            LEFT JOIN ordens_instalacoes i ON i.ordem_id = o.id
            LEFT JOIN users uc ON uc.id = o.criador_id
            LEFT JOIN users ur ON ur.id = o.responsavel_id
            ORDER BY o.data_criacao DESC
        `;

        const result = await pool.query(baseQuery);
        const ordens = result.rows;

        await atualizarOrdens(ordens);

        res.json(ordens);
    } catch (err) {
        console.error("Erro ao listar ordens detalhadas:", err);
        res.status(500).json({ erro: "Erro ao listar ordens detalhadas" });
    }
}

/* ===========================================================
    Listar apenas as ordens do usuário logado
=========================================================== */
export async function listarMinhasOrdens(req, res) {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            `SELECT * FROM ordens WHERE criador_id = $1 ORDER BY data_criacao DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao listar minhas ordens:", err);
        res.status(500).json({ erro: "Erro ao listar suas ordens" });
    }
}

/* ===========================================================
    Concluir ordem
=========================================================== */
export async function concluirOrdem(req, res) {
    const { ordemId } = req.params;
    const { solucao } = req.body;
    const usuario = req.user;

    if (usuario.role !== "suporte") {
        return res.status(403).json({ erro: "Apenas suporte pode concluir ordens" });
    }

    try {
        const result = await pool.query(
            `UPDATE ordens
             SET solucao = $1, status = 'Concluída', data_finalizacao = NOW()
             WHERE id = $2
             RETURNING *`,
            [solucao, ordemId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ erro: "Ordem não encontrada" });
        }

        res.json({ mensagem: "Ordem concluída com sucesso", ordem: result.rows[0] });
    } catch (err) {
        console.error("Erro ao concluir ordem:", err);
        res.status(500).json({ erro: "Erro interno ao concluir a ordem" });
    }
}

// ================================
// AVALIAR ORDEM
// ================================
export async function avaliarOrdem(req, res) {
    try {
        const userId = req.user.id;
        const { ordemId } = req.params;
        const { avaliacao } = req.body;

        if (!avaliacao || avaliacao < 1 || avaliacao > 5) {
            return res.status(400).json({ erro: "A avaliação deve ser entre 1 e 5." });
        }

        // verifica se a ordem existe e pertence ao usuário
        const result = await pool.query(
            "SELECT criador_id, status FROM ordens WHERE id = $1",
            [ordemId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ erro: "Ordem não encontrada." });
        }

        const ordem = result.rows[0];
        if (ordem.criador_id !== userId) {
            return res.status(403).json({ erro: "Você só pode avaliar suas próprias ordens." });
        }

        if (ordem.status !== "Concluída") {
            return res.status(400).json({ erro: "Só é possível avaliar ordens concluídas." });
        }

        await pool.query(
            "UPDATE ordens SET avaliacao = $1 WHERE id = $2",
            [avaliacao, ordemId]
        );

        res.json({ mensagem: "Avaliação registrada com sucesso!" });
    } catch (err) {
        console.error("Erro ao avaliar ordem:", err);
        res.status(500).json({ erro: "Erro interno ao registrar avaliação." });
    }
}



/* ===========================================================
    Assumir ordem
=========================================================== */
export async function assumirOrdem(req, res) {
    const { ordemId } = req.params;
    const usuario = req.user;

    if (usuario.role !== "suporte") {
        return res.status(403).json({ erro: "Apenas suporte pode assumir ordens" });
    }

    try {
        const result = await pool.query(
            `UPDATE ordens
             SET responsavel_id = $1, status = 'Em Andamento'
             WHERE id = $2 AND (status = 'Pendente' OR responsavel_id IS NULL)
             RETURNING *`,
            [usuario.id, ordemId]
        );

        if (result.rowCount === 0) {
            return res.status(400).json({ erro: "Ordem não disponível para assumir" });
        }

        res.json({ mensagem: "Ordem assumida", ordem: result.rows[0] });
    } catch (err) {
        console.error("Erro ao assumir ordem:", err);
        res.status(500).json({ erro: "Erro interno ao assumir a ordem" });
    }
}

/* ===========================================================
    Listar alertas de ordens pendentes
=========================================================== */
export async function listarAlertasOrdensPendentes(req, res) {
    const usuario = req.user;

    if (usuario.role !== "suporte") {
        return res.status(403).json({ erro: "Apenas suporte pode ver alertas" });
    }

    try {
        const hoje = dayjs();
        const result = await pool.query(
            `SELECT * FROM ordens WHERE responsavel_id IS NULL AND status = 'Pendente'`
        );

        const ordens = result.rows.map(ordem => {
            const dataCriacao = dayjs(ordem.data_criacao);
            if (!dataCriacao.isValid()) return { ...ordem, alerta_sem_responsavel: false };

            let diasUteis = 0;
            let temp = dataCriacao.clone();
            while (temp.isBefore(hoje, "day")) {
                temp = temp.add(1, "day");
                if (temp.day() !== 0 && temp.day() !== 6) diasUteis++;
            }
            return { ...ordem, alerta_sem_responsavel: diasUteis > 2 };
        });

        res.json(ordens.filter(o => o.alerta_sem_responsavel));
    } catch (err) {
        console.error("Erro ao listar alertas:", err);
        res.status(500).json({ erro: "Erro ao listar alertas" });
    }
}

