import pool from "../config/db.js";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween.js";
dayjs.extend(isBetween);



/* ===========================================================
   Criar nova ordem
=========================================================== */
/* ===========================================================
   Criar nova ordem (CORRIGIDO)
=========================================================== */
export async function criarOrdem(req, res) {
    const criadorId = req.user.id;
    const status = "Pendente";

    try {
        const {
            tipo_solicitacao, local_tipo, local_detalhe, descricao, observacoes,
            equipamento, tipo_problema, app_nome, app_versao, app_link,
        } = req.body;

        if (!criadorId || !tipo_solicitacao || !local_tipo || !local_detalhe) {
            return res.status(400).json({ erro: "Dados obrigatórios não fornecidos (Criador/Local)." });
        }

        // 🚨 VALIDAÇÃO ADICIONAL:
        if (tipo_solicitacao === 'instalacao' && !app_nome) {
            // Se for instalação, o nome do app é crucial.
            return res.status(400).json({ erro: "O nome do aplicativo é obrigatório para solicitação de instalação." });
        }

        if (!descricao) {
             // A descrição é obrigatória para o INSERT na tabela principal, 
             // seja ela a descrição do problema ou a nota da instalação.
            return res.status(400).json({ erro: "A descrição da ordem é obrigatória." });
        }

        const titulo = tipo_solicitacao === 'problema'
            ? `${local_detalhe} - ${equipamento || 'Outro Equipamento'}`
            : `${local_detalhe} - ${app_nome || 'Sem nome do App'}`; // Se o app_nome estiver vazio, já vai parar na validação acima.

        // Inicia a transação se você quiser garantir a atomicidade (melhor prática, mas opcional se a falha for apenas de validação)
        // await pool.query('BEGIN');

        const result = await pool.query(
            `INSERT INTO ordens
            (titulo, descricao, status, criador_id, tipo_solicitacao, local_tipo, local_detalhe, observacoes)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING id, codigo`,
            [titulo, descricao, status, criadorId, tipo_solicitacao, local_tipo, local_detalhe, observacoes || null]
        );

        const ordemId = result.rows[0].id;
        const codigo = result.rows[0].codigo;

        if (tipo_solicitacao === 'problema') {
            await pool.query(
                `INSERT INTO ordens_problemas (ordem_id, equipamento, tipo_problema)
                VALUES ($1,$2,$3)`,
                [ordemId, equipamento, tipo_problema || 'Outro']
            );
        } else if (tipo_solicitacao === 'instalacao') {
            await pool.query(
                `INSERT INTO ordens_instalacoes (ordem_id, app_nome, app_versao, app_link)
                VALUES ($1,$2,$3,$4)`,
                // Garantir que app_nome não é null e que app_versao/app_link são null se vazios
                [ordemId, app_nome, app_versao || null, app_link || null]
            );
        }

        // await pool.query('COMMIT'); // Commit se usar transação

        return res.status(201).json({
            mensagem: "Ordem criada com sucesso",
            ordem: { id: ordemId, codigo }
        });

    } catch (err) {
        // await pool.query('ROLLBACK'); // Rollback se usar transação
        console.error("Erro ao criar ordem:", err);
        // Pode ser útil ver qual é o erro exato do DB:
        // return res.status(500).json({ erro: "Erro interno no servidor ao processar a ordem", detail: err.message });
        return res.status(500).json({ erro: "Erro interno no servidor ao processar a ordem" });
    }
}

/* ===========================================================
   Listar ordens (com verificação de prazo e alertas)
=========================================================== */
export async function listarOrdens(req, res) {
  try {
    const { id, tipo } = req.user; // tipo = "suporte" ou "professor"
    let result;

    if (tipo === "professor") {
      // Mostra apenas as ordens criadas pelo professor
      result = await pool.query(
        "SELECT * FROM ordens WHERE criador_id = $1 ORDER BY data_criacao DESC",
        [id]
      );
    } else if (tipo === "suporte") {
      // Suporte vê todas as ordens
      result = await pool.query("SELECT * FROM ordens ORDER BY data_criacao DESC");
    } else {
      return res.status(403).json({ erro: "Tipo de usuário inválido" });
    }

    const ordens = result.rows;
    const hoje = dayjs();

    // Atualiza status e calcula alerta
    for (let ordem of ordens) {
      const prazo = dayjs(ordem.data_limite);

      // 1️ Se passou do prazo e não está concluída → marca como "não concluída"
      if (
        ordem.status !== "concluída" &&
        ordem.status !== "não concluída" &&
        hoje.isAfter(prazo)
      ) {
          await pool.query("UPDATE ordens SET status = 'Não Concluída' WHERE id = $1", [
            ordem.id,
        ]);
        ordem.status = "não concluída";
      }

      // 2️ Calcula dias úteis restantes
      let faltando = 0;
      let temp = hoje;
      while (temp.isBefore(prazo, "day")) {
        temp = temp.add(1, "day");
        if (temp.day() !== 0 && temp.day() !== 6) {
          faltando++;
        }
      }

      // 3️ Define flag de alerta se faltam ≤ 3 dias úteis
      ordem.alerta_prazo =
        faltando <= 3 &&
        ordem.status !== "concluída" &&
        ordem.status !== "não concluída";
    }

    res.json(ordens);
  } catch (err) {
    console.error("Erro ao listar ordens:", err);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
}
