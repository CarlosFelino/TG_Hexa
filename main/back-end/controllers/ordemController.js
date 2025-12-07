import pool from "../config/db.js";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween.js";
import fs from "fs";
import path from "path";

dayjs.extend(isBetween);

/* ===========================================================
    ✅ FUNÇÃO AUXILIAR: Calcular dias úteis entre duas datas
=========================================================== */
function calcularDiasUteis(dataInicio, dataFim) {
    let dias = 0;
    let temp = dayjs(dataInicio);
    const fim = dayjs(dataFim);

    while (temp.isBefore(fim, "day") || temp.isSame(fim, "day")) {
        if (temp.day() !== 0 && temp.day() !== 6) {
            dias++;
        }
        temp = temp.add(1, "day");
    }
    return dias;
}

export async function atualizarOrdens(ordens, dataReferencia = dayjs()) {
    const hoje = dataReferencia;

    console.log('='.repeat(60));
    console.log('🔄 INICIANDO ATUALIZAÇÃO DE ORDENS');
    console.log('📅 Data de referência:', hoje.format('YYYY-MM-DD HH:mm:ss'));
    console.log('📊 Total de ordens:', ordens.length);
    console.log('='.repeat(60));

    for (let ordem of ordens) {
        console.log('\n' + '-'.repeat(60));
        console.log(`🔍 Analisando Ordem ID: ${ordem.id} | Código: ${ordem.codigo}`);

        if (!ordem.data_limite) {
            console.warn(`⚠️  Ordem ID ${ordem.id} não possui data_limite. Pulando.`);
            continue;
        }

        // ✅ CRITICAL DEBUG: Ver exatamente o que está sendo comparado
        const prazo = dayjs(ordem.data_limite).endOf('day');

        console.log('📋 Status atual:', ordem.status);
        console.log('📅 Data criação:', dayjs(ordem.data_criacao).format('YYYY-MM-DD HH:mm:ss'));
        console.log('⏰ Data limite (raw):', ordem.data_limite);
        console.log('⏰ Data limite (parsed):', prazo.format('YYYY-MM-DD HH:mm:ss'));
        console.log('🕐 Hoje:', hoje.format('YYYY-MM-DD HH:mm:ss'));

        if (!prazo.isValid()) {
            console.warn(`❌ Data limite INVÁLIDA para Ordem ID ${ordem.id}. Pulando.`);
            continue;
        }

        // ✅ TESTES DE COMPARAÇÃO
        console.log('\n🧪 TESTES DE COMPARAÇÃO:');
        console.log('   hoje.isAfter(prazo):', hoje.isAfter(prazo));
        console.log('   hoje.isAfter(prazo, "day"):', hoje.isAfter(prazo, "day"));
        console.log('   hoje > prazo:', hoje > prazo);
        console.log('   Diferença em dias:', hoje.diff(prazo, 'day'));
        console.log('   Diferença em horas:', hoje.diff(prazo, 'hour'));

        try {
            let statusAtualizado = false;

            // ✅ CONDIÇÃO PRINCIPAL
            const deveVirarNaoConcluida = (
                ordem.status !== "Concluída" && 
                ordem.status !== "Não Concluída" && 
                hoje.isAfter(prazo) // ← SEM "day"
            );

            console.log('\n🎯 DEVE MUDAR PARA "NÃO CONCLUÍDA"?', deveVirarNaoConcluida);
            console.log('   Motivos:');
            console.log('   - Status não é Concluída?', ordem.status !== "Concluída");
            console.log('   - Status não é Não Concluída?', ordem.status !== "Não Concluída");
            console.log('   - Hoje está depois do prazo?', hoje.isAfter(prazo));

            if (deveVirarNaoConcluida) {
                console.log('\n🚨 MUDANDO STATUS PARA "NÃO CONCLUÍDA"!');

                await pool.query(
                    "UPDATE ordens SET status = 'Não Concluída', prioridade = 1 WHERE id = $1",
                    [ordem.id]
                );

                ordem.status = "Não Concluída";
                ordem.prioridade = 1;
                statusAtualizado = true;

                await pool.query(
                    `UPDATE ordens_alertas SET ativo = false, resolvido_em = NOW()
                     WHERE ordem_id = $1 AND ativo = true`,
                    [ordem.id]
                );

                console.log('✅ Status atualizado com sucesso!');
                continue;
            }

            // ✅ Já está finalizada
            if (ordem.status === "Concluída" || ordem.status === "Não Concluída") {
                console.log('ℹ️  Ordem já finalizada, garantindo prioridade = 1');

                if (ordem.prioridade !== 1) {
                    await pool.query("UPDATE ordens SET prioridade = 1 WHERE id = $1", [ordem.id]);
                    ordem.prioridade = 1;
                }

                await pool.query(
                    `UPDATE ordens_alertas SET ativo = false, resolvido_em = NOW()
                     WHERE ordem_id = $1 AND ativo = true`,
                    [ordem.id]
                );
                continue;
            }

            // ✅ Calcular prioridade para ordens ativas
            const faltando = calcularDiasUteis(hoje, prazo);
            console.log(`\n📊 Dias úteis faltando: ${faltando}`);

            let prioridade = 1;
            if (faltando <= 1) prioridade = 5;
            else if (faltando === 2) prioridade = 4;
            else if (faltando === 3) prioridade = 3;
            else if (faltando === 4) prioridade = 2;
            else prioridade = 1;

            console.log(`🎯 Prioridade calculada: ${prioridade}`);

            // ✅ Alerta sem responsável
            let alertaSemResponsavel = false;
            if (!ordem.responsavel_id && ordem.status === "Pendente") {
                const dataCriacao = dayjs(ordem.data_criacao);
                const diasUteisDesdeCreacao = calcularDiasUteis(dataCriacao, hoje);

                console.log(`📋 Sem responsável há ${diasUteisDesdeCreacao} dias úteis`);

                if (diasUteisDesdeCreacao > 2) {
                    prioridade = Math.max(prioridade, 4);
                    alertaSemResponsavel = true;
                    console.log('⚠️  Alerta sem responsável ativado!');
                }
            }

            const alertaPrazo = faltando <= 3 && prioridade >= 3;
            console.log(`⏰ Alerta de prazo: ${alertaPrazo}`);

            // ✅ Atualizar prioridade se necessário
            if (ordem.prioridade !== prioridade || statusAtualizado) {
                await pool.query(
                    "UPDATE ordens SET prioridade = $1 WHERE id = $2",
                    [prioridade, ordem.id]
                );
                ordem.prioridade = prioridade;
                console.log(`✅ Prioridade atualizada para ${prioridade}`);
            }

            // ✅ Gerenciar alertas
            if (alertaPrazo) {
                await pool.query(
                    `INSERT INTO ordens_alertas (ordem_id, tipo_alerta, ativo)
                     VALUES ($1, 'prazo', true)
                     ON CONFLICT (ordem_id, tipo_alerta) 
                     DO UPDATE SET ativo = true, resolvido_em = NULL`,
                    [ordem.id]
                );
                console.log('✅ Alerta de prazo ativado');
            } else {
                await pool.query(
                    `UPDATE ordens_alertas
                     SET ativo = false, resolvido_em = NOW()
                     WHERE ordem_id = $1 AND tipo_alerta = 'prazo' AND ativo = true`,
                    [ordem.id]
                );
            }

            if (alertaSemResponsavel) {
                await pool.query(
                    `INSERT INTO ordens_alertas (ordem_id, tipo_alerta, ativo)
                     VALUES ($1, 'sem_responsavel', true)
                     ON CONFLICT (ordem_id, tipo_alerta) 
                     DO UPDATE SET ativo = true, resolvido_em = NULL`,
                    [ordem.id]
                );
                console.log('✅ Alerta sem responsável ativado');
            } else {
                await pool.query(
                    `UPDATE ordens_alertas
                     SET ativo = false, resolvido_em = NOW()
                     WHERE ordem_id = $1 AND tipo_alerta = 'sem_responsavel' AND ativo = true`,
                    [ordem.id]
                );
            }

            ordem.alerta_prazo = alertaPrazo;
            ordem.alerta_sem_responsavel = alertaSemResponsavel;

        } catch (error) {
            console.error(`❌ ERRO ao atualizar Ordem ID ${ordem.id}:`, error);
            throw error;
        }

        console.log('-'.repeat(60));
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ ATUALIZAÇÃO CONCLUÍDA');
    console.log('='.repeat(60) + '\n');
}

/* ===========================================================
    ✅ NOVA ROTA: Listar alertas ativos (para pop-ups)
=========================================================== */
export async function listarAlertasAtivos(req, res) {
    const usuario = req.user;

    if (usuario.role !== "suporte") {
        return res.status(403).json({ erro: "Apenas suporte pode ver alertas" });
    }

    try {
        const result = await pool.query(
            `SELECT DISTINCT 
                o.id, o.codigo, o.titulo, o.status, o.prioridade,
                o.data_criacao, o.data_limite, o.responsavel_id,
                oa.tipo_alerta
             FROM ordens o
             INNER JOIN ordens_alertas oa ON oa.ordem_id = o.id
             WHERE oa.ativo = true
               AND o.status NOT IN ('Concluída', 'Não Concluída')
               AND o.prioridade >= 3
             ORDER BY o.prioridade DESC, o.data_criacao ASC`
        );

        const alertas = {
            prazo: [],
            sem_responsavel: []
        };

        result.rows.forEach(row => {
            const alerta = {
                id: row.id,
                codigo: row.codigo,
                titulo: row.titulo,
                status: row.status,
                prioridade: row.prioridade,
                data_limite: row.data_limite
            };

            if (row.tipo_alerta === 'prazo') {
                alertas.prazo.push(alerta);
            } else if (row.tipo_alerta === 'sem_responsavel') {
                alertas.sem_responsavel.push(alerta);
            }
        });

        res.json(alertas);
    } catch (err) {
        console.error("Erro ao listar alertas ativos:", err);
        res.status(500).json({ erro: "Erro ao listar alertas" });
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
                o.responsavel_id, o.data_limite, o.prioridade,
                p.equipamento, p.tipo_problema,
                i.app_nome, i.app_versao, i.app_link,
                u.nome AS tecnico_nome,
                (SELECT COUNT(*) FROM ordens_anexos WHERE ordem_id = o.id) as total_anexos
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

        if (!id || (tipo !== "suporte" && tipo !== "admin")) {
            return res.status(403).json({ erro: "Acesso negado: apenas suporte ou admin podem visualizar" });
        }

        const baseQuery = `
            SELECT 
                o.id, o.codigo, o.data_criacao, o.titulo, o.descricao,
                o.local_tipo, o.local_detalhe, o.tipo_solicitacao, o.status, 
                o.avaliacao, o.responsavel_id, o.criador_id, o.data_limite,
                o.solucao, o.observacoes, o.prioridade,
                p.equipamento, p.tipo_problema,
                i.app_nome, i.app_versao, i.app_link,
                uc.nome AS criador_nome,
                ur.nome AS responsavel_nome,
                (SELECT COUNT(*) FROM ordens_anexos WHERE ordem_id = o.id) as total_anexos
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
    Buscar anexos de uma ordem específica
=========================================================== */
export async function buscarAnexosOrdem(req, res) {
    try {
        const { ordemId } = req.params;
        const userId = req.user?.id;
        const userRole = req.user?.role;

        if (!userId) {
            return res.status(401).json({ erro: "Usuário não autenticado" });
        }

        const ordemResult = await pool.query(
            "SELECT criador_id FROM ordens WHERE id = $1",
            [ordemId]
        );

        if (ordemResult.rowCount === 0) {
            return res.status(404).json({ erro: "Ordem não encontrada" });
        }

        const ordem = ordemResult.rows[0];

        if (userRole !== "suporte" && userRole !== "admin" && ordem.criador_id !== userId) {
            return res.status(403).json({ erro: "Acesso negado" });
        }

        const anexosResult = await pool.query(
            `SELECT id, arquivo_nome, arquivo_url, criado_em 
             FROM ordens_anexos 
             WHERE ordem_id = $1 
             ORDER BY criado_em ASC`,
            [ordemId]
        );

        const anexos = anexosResult.rows.map(anexo => ({
            id: anexo.id,
            nome: anexo.arquivo_nome,
            url: `/uploads/${ordemId}/${anexo.arquivo_nome}`,
            criado_em: anexo.criado_em
        }));

        res.json(anexos);
    } catch (err) {
        console.error("Erro ao buscar anexos da ordem:", err);
        res.status(500).json({ erro: "Erro ao buscar anexos" });
    }
}

/* ===========================================================
    ✅ Listar apenas as ordens CRIADAS pelo usuário logado
=========================================================== */
export async function listarMinhasOrdens(req, res) {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        console.log("=== DEBUG listarMinhasOrdens ===", { userId, userRole });

        const result = await pool.query(
            `SELECT 
                o.id, o.codigo, o.data_criacao, o.titulo, o.descricao,
                o.local_detalhe, o.tipo_solicitacao, o.status, o.avaliacao,
                o.responsavel_id, o.data_limite,
                p.equipamento, p.tipo_problema,
                i.app_nome, i.app_versao, i.app_link,
                u.nome AS tecnico_nome,
                (SELECT COUNT(*) FROM ordens_anexos WHERE ordem_id = o.id) as total_anexos
             FROM ordens o
             LEFT JOIN ordens_problemas p ON p.ordem_id = o.id
             LEFT JOIN ordens_instalacoes i ON i.ordem_id = o.id
             LEFT JOIN users u ON u.id = o.responsavel_id
             WHERE o.criador_id = $1
             ORDER BY o.data_criacao DESC`,
            [userId]
        );

        const ordens = result.rows;
        await atualizarOrdens(ordens);

        res.json(ordens);
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
             SET solucao = $1, status = 'Concluída', data_finalizacao = NOW(), prioridade = 1
             WHERE id = $2
             RETURNING *`,
            [solucao, ordemId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ erro: "Ordem não encontrada" });
        }

        await pool.query(
            `UPDATE ordens_alertas SET ativo = false, resolvido_em = NOW()
             WHERE ordem_id = $1 AND ativo = true`,
            [ordemId]
        );

        res.json({ mensagem: "Ordem concluída com sucesso", ordem: result.rows[0] });
    } catch (err) {
        console.error("Erro ao concluir ordem:", err);
        res.status(500).json({ erro: "Erro interno ao concluir a ordem" });
    }
}

/* ===========================================================
    Avaliar ordem
=========================================================== */
export async function avaliarOrdem(req, res) {
    try {
        const userId = req.user.id;
        const { ordemId } = req.params;
        const { avaliacao } = req.body;

        if (!avaliacao || avaliacao < 1 || avaliacao > 5) {
            return res.status(400).json({ erro: "A avaliação deve ser entre 1 e 5." });
        }

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
    ✅ ASSUMIR ORDEM (Corrigido - valida status e desativa alerta)
=========================================================== */
export async function assumirOrdem(req, res) {
    const { ordemId } = req.params;
    const usuario = req.user;

    if (usuario.role !== "suporte") {
        return res.status(403).json({ erro: "Apenas suporte pode assumir ordens" });
    }

    try {
        // ✅ Verificar o status atual da ordem
        const checkResult = await pool.query(
            "SELECT status FROM ordens WHERE id = $1",
            [ordemId]
        );

        if (checkResult.rowCount === 0) {
            return res.status(404).json({ erro: "Ordem não encontrada" });
        }

        const ordemAtual = checkResult.rows[0];

        // ✅ Bloquear ordens "Não Concluída" ou "Concluída"
        if (ordemAtual.status === "Não Concluída") {
            return res.status(400).json({ 
                erro: "Não é possível assumir uma ordem não concluída. Esta ordem ultrapassou o prazo." 
            });
        }

        if (ordemAtual.status === "Concluída") {
            return res.status(400).json({ 
                erro: "Não é possível assumir uma ordem já concluída." 
            });
        }

        // ✅ Tentar assumir (apenas se Pendente)
        const result = await pool.query(
            `UPDATE ordens
             SET responsavel_id = $1, status = 'Em Andamento'
             WHERE id = $2 AND status = 'Pendente' AND responsavel_id IS NULL
             RETURNING *`,
            [usuario.id, ordemId]
        );

        if (result.rowCount === 0) {
            return res.status(400).json({ 
                erro: "Ordem não disponível para assumir. Ela pode já ter sido assumida por outro técnico ou não estar mais pendente." 
            });
        }

        // ✅ Desativar alerta de "sem responsável"
        await pool.query(
            `UPDATE ordens_alertas 
             SET ativo = false, resolvido_em = NOW()
             WHERE ordem_id = $1 AND tipo_alerta = 'sem_responsavel' AND ativo = true`,
            [ordemId]
        );

        res.json({ mensagem: "Ordem assumida com sucesso", ordem: result.rows[0] });
    } catch (err) {
        console.error("Erro ao assumir ordem:", err);
        res.status(500).json({ erro: "Erro interno ao assumir a ordem" });
    }
}

/* ===========================================================
    AtribuirOrdem (GerenciarUsuários)
=========================================================== */
// ===================================================
// BACKEND: Adicionar no ordemController.js
// ===================================================

export const atribuirOrdem = async (req, res) => {
  try {
    const { id } = req.params;
    const { responsavel_id } = req.body;

    console.log('📋 [ATRIBUIR] Ordem:', id, '→ Responsável:', responsavel_id);

    if (!responsavel_id) {
      return res.status(400).json({
        success: false,
        message: "ID do responsável é obrigatório"
      });
    }

    // Verificar se o novo responsável existe e é suporte
    const userCheck = await pool.query(
      'SELECT id, role FROM users WHERE id = $1 AND deletado_em IS NULL',
      [responsavel_id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado"
      });
    }

    if (userCheck.rows[0].role !== 'suporte') {
      return res.status(400).json({
        success: false,
        message: "Apenas usuários de suporte podem ser responsáveis"
      });
    }

    // Atualizar ordem
    const result = await pool.query(
      `UPDATE ordens 
       SET responsavel_id = $1, data_atualizacao = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [responsavel_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ordem não encontrada"
      });
    }

    console.log('✅ [ATRIBUIR] Ordem reatribuída com sucesso');

    res.status(200).json({
      success: true,
      message: "Ordem reatribuída com sucesso",
      ordem: result.rows[0]
    });

  } catch (error) {
    console.error("❌ [ATRIBUIR] Erro:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atribuir ordem"
    });
  }
};


/* ===========================================================
    Listar alertas de ordens pendentes (função obsoleta)
=========================================================== */
export async function listarAlertasOrdensPendentes(req, res) {
    return listarAlertasAtivos(req, res);
}