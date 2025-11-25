// ============================================
// 📌 GOController.js - Controlador de Gerenciamento de Ordens (Admin)
// ============================================

import pool from "../config/db.js";

/**
 * Buscar todas as ordens com informações completas
 * GET /api/admin/ordens
 */
export const listarTodasOrdens = async (req, res) => {
  try {
    const query = `
      SELECT 
        o.id,
        o.codigo,
        o.tipo_solicitacao,
        o.local_tipo,
        o.local_detalhe,
        o.titulo,
        o.descricao,
        o.solucao,
        o.observacoes,
        o.status,
        o.data_criacao,
        o.data_atualizacao,
        o.data_finalizacao,
        o.prioridade,
        o.avaliacao,
        o.data_limite,

        -- Dados do criador (solicitante)
        u_criador.nome AS solicitante_nome,
        u_criador.email AS solicitante_email,

        -- Dados do responsável (técnico)
        u_responsavel.nome AS tecnico_nome,
        u_responsavel.email AS tecnico_email,

        -- Equipamento (se for problema)
        op.equipamento,
        op.tipo_problema,

        -- Instalação (se for instalação)
        oi.app_nome,
        oi.app_versao,
        oi.app_link,

        -- Contagem de anexos
        (SELECT COUNT(*) FROM ordens_anexos WHERE ordem_id = o.id) as total_anexos

      FROM ordens o
      LEFT JOIN users u_criador ON o.criador_id = u_criador.id
      LEFT JOIN users u_responsavel ON o.responsavel_id = u_responsavel.id
      LEFT JOIN ordens_problemas op ON o.id = op.ordem_id
      LEFT JOIN ordens_instalacoes oi ON o.id = oi.ordem_id
      ORDER BY o.data_criacao DESC
    `;

    const result = await pool.query(query);

    // Formatar os dados para o frontend
    const ordensFormatadas = result.rows.map(ordem => {
      // Mapear status do banco para o formato do frontend
      let statusFormatado = 'pending';
      switch (ordem.status) {
        case 'Pendente':
          statusFormatado = 'pending';
          break;
        case 'Em Andamento':
          statusFormatado = 'in-progress';
          break;
        case 'Concluída':
          statusFormatado = 'completed';
          break;
        case 'Não Concluída':
          statusFormatado = 'not-completed';
          break;
      }

      return {
        id: (ordem.codigo || `ORD-${ordem.id}`).replace('#', ''),
        id_numerico: ordem.id, // ID real para operações
        solicitante: ordem.solicitante_nome || 'Não informado',
        email: ordem.solicitante_email || 'Não informado',
        local: ordem.local_tipo === 'sala' 
          ? `Sala ${ordem.local_detalhe}` 
          : `Laboratório ${ordem.local_detalhe}`,
        local_tipo: ordem.local_tipo,
        local_detalhe: ordem.local_detalhe,
        descricao: ordem.titulo || ordem.descricao,
        descricao_completa: ordem.descricao,
        titulo: ordem.titulo,
        data: ordem.data_criacao,
        tipo: ordem.tipo_solicitacao,
        equipamento: ordem.equipamento || ordem.app_nome || 'N/A',
        status: statusFormatado,
        status_original: ordem.status,
        tecnico: ordem.tecnico_nome || null,
        tecnico_email: ordem.tecnico_email || null,
        avaliacao: ordem.avaliacao || null,
        prioridade: ordem.prioridade || 1,
        data_limite: ordem.data_limite,
        solucao: ordem.solucao,
        observacoes: ordem.observacoes,
        data_finalizacao: ordem.data_finalizacao,
        total_anexos: parseInt(ordem.total_anexos) || 0,
        // Dados extras para detalhes
        tipo_problema: ordem.tipo_problema,
        app_nome: ordem.app_nome,
        app_versao: ordem.app_versao,
        app_link: ordem.app_link
      };
    });

    res.status(200).json({
      success: true,
      ordens: ordensFormatadas,
      total: ordensFormatadas.length
    });

  } catch (error) {
    console.error("Erro ao buscar ordens:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar ordens",
      error: error.message
    });
  }
};

/**
 * Buscar anexos de uma ordem específica
 * GET /api/admin/ordens/:id/anexos
 */
export const buscarAnexosOrdem = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Buscando anexos para ordem:', id);

    // Buscar o ID numérico da ordem
    const ordemResult = await pool.query(
      "SELECT id FROM ordens WHERE codigo = $1 OR id::text = $1",
      [id]
    );

    if (ordemResult.rows.length === 0) {
      console.log('❌ Ordem não encontrada:', id);
      return res.status(404).json({
        success: false,
        message: "Ordem não encontrada"
      });
    }

    console.log('✅ Ordem encontrada, ID numérico:', ordemResult.rows[0].id);

    const ordemId = ordemResult.rows[0].id;

    // Buscar anexos
    const anexosResult = await pool.query(
      `SELECT id, arquivo_nome, arquivo_url, data_upload as criado_em 
       FROM ordens_anexos 
       WHERE ordem_id = $1 
       ORDER BY data_upload ASC`,
      [ordemId]
    );

    const anexos = anexosResult.rows.map(anexo => ({
      id: anexo.id,
      nome: anexo.arquivo_nome,
      url: `/uploads/${ordemId}/${anexo.arquivo_nome}`,
      criado_em: anexo.criado_em
    }));

    console.log('📎 Anexos encontrados:', anexos.length);

    res.json({
      success: true,
      anexos: anexos,
      total: anexos.length
    });

  } catch (error) {
    console.error("Erro ao buscar anexos:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar anexos",
      error: error.message
    });
  }
};

/**
 * Buscar estatísticas das ordens
 * GET /api/admin/ordens/estatisticas
 */
export const obterEstatisticas = async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'Pendente') as pendentes,
        COUNT(*) FILTER (WHERE status = 'Em Andamento') as em_andamento,
        COUNT(*) FILTER (WHERE status = 'Concluída') as concluidas,
        COUNT(*) FILTER (WHERE status = 'Não Concluída') as nao_concluidas,
        COUNT(*) as total
      FROM ordens
    `;

    const result = await pool.query(query);
    const stats = result.rows[0];

    res.status(200).json({
      success: true,
      estatisticas: {
        pendentes: parseInt(stats.pendentes) || 0,
        emAndamento: parseInt(stats.em_andamento) || 0,
        concluidas: parseInt(stats.concluidas) || 0,
        naoConcluidas: parseInt(stats.nao_concluidas) || 0,
        total: parseInt(stats.total) || 0
      }
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

/**
 * Buscar uma ordem específica por ID
 * GET /api/admin/ordens/:id
 */
export const buscarOrdemPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        o.*,
        u_criador.nome AS solicitante_nome,
        u_criador.email AS solicitante_email,
        u_responsavel.nome AS tecnico_nome,
        u_responsavel.email AS tecnico_email,
        op.equipamento,
        op.tipo_problema,
        oi.app_nome,
        oi.app_versao,
        oi.app_link,
        (SELECT COUNT(*) FROM ordens_anexos WHERE ordem_id = o.id) as total_anexos
      FROM ordens o
      LEFT JOIN users u_criador ON o.criador_id = u_criador.id
      LEFT JOIN users u_responsavel ON o.responsavel_id = u_responsavel.id
      LEFT JOIN ordens_problemas op ON o.id = op.ordem_id
      LEFT JOIN ordens_instalacoes oi ON o.id = oi.ordem_id
      WHERE o.codigo = $1 OR o.id::text = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ordem não encontrada"
      });
    }

    const ordem = result.rows[0];

    res.status(200).json({
      success: true,
      ordem: {
        id: ordem.codigo || `ORD-${ordem.id}`,
        id_numerico: ordem.id,
        solicitante: ordem.solicitante_nome,
        email: ordem.solicitante_email,
        local: `${ordem.local_tipo} ${ordem.local_detalhe}`,
        local_tipo: ordem.local_tipo,
        local_detalhe: ordem.local_detalhe,
        descricao: ordem.descricao,
        titulo: ordem.titulo,
        data: ordem.data_criacao,
        tipo: ordem.tipo_solicitacao,
        equipamento: ordem.equipamento || ordem.app_nome,
        tipo_problema: ordem.tipo_problema,
        app_nome: ordem.app_nome,
        app_versao: ordem.app_versao,
        app_link: ordem.app_link,
        status: ordem.status,
        tecnico: ordem.tecnico_nome,
        avaliacao: ordem.avaliacao,
        solucao: ordem.solucao,
        observacoes: ordem.observacoes,
        total_anexos: parseInt(ordem.total_anexos) || 0
      }
    });

  } catch (error) {
    console.error("Erro ao buscar ordem:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar ordem",
      error: error.message
    });
  }
};

/**
 * Atualizar ordem completa
 * PUT /api/admin/ordens/:id
 */
export const atualizarOrdem = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    console.log('✏️ Atualizando ordem:', id);
    console.log('📦 Dados recebidos:', req.body);

    const {
      titulo,
      descricao,
      observacoes,
      status,
      local_tipo,
      local_detalhe,
      tipo_solicitacao,
      equipamento,
      tipo_problema,
      app_nome,
      app_versao,
      app_link
    } = req.body;

    await client.query('BEGIN');

    // Buscar ordem
    const ordemResult = await client.query(
      "SELECT * FROM ordens WHERE codigo = $1 OR id::text = $1",
      [id]
    );

    if (ordemResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: "Ordem não encontrada"
      });
    }

    const ordem = ordemResult.rows[0];
    const ordemId = ordem.id;

    // Não permitir edição se status for "Não Concluída"
    if (ordem.status === 'Não Concluída') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: "Ordens com status 'Não Concluída' não podem ser editadas"
      });
    }

    // Atualizar dados principais da ordem
    const updateQuery = `
      UPDATE ordens 
      SET 
        titulo = COALESCE($1, titulo),
        descricao = COALESCE($2, descricao),
        observacoes = $3,
        status = COALESCE($4, status),
        local_tipo = COALESCE($5, local_tipo),
        local_detalhe = COALESCE($6, local_detalhe),
        tipo_solicitacao = COALESCE($7, tipo_solicitacao),
        data_atualizacao = NOW()
      WHERE id = $8
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      titulo,
      descricao,
      observacoes,
      status,
      local_tipo,
      local_detalhe,
      tipo_solicitacao,
      ordemId
    ]);

    // Atualizar tabelas relacionadas se necessário
    if (tipo_solicitacao === 'problema' && (equipamento || tipo_problema)) {
      // Verificar se já existe registro
      const problemaExists = await client.query(
        "SELECT id FROM ordens_problemas WHERE ordem_id = $1",
        [ordemId]
      );

      if (problemaExists.rows.length > 0) {
        // Atualizar
        await client.query(
          `UPDATE ordens_problemas 
           SET equipamento = COALESCE($1, equipamento),
               tipo_problema = COALESCE($2, tipo_problema)
           WHERE ordem_id = $3`,
          [equipamento, tipo_problema, ordemId]
        );
      } else {
        // Inserir
        await client.query(
          `INSERT INTO ordens_problemas (ordem_id, equipamento, tipo_problema)
           VALUES ($1, $2, $3)`,
          [ordemId, equipamento || 'Não especificado', tipo_problema || 'Não especificado']
        );
      }
    }

    if (tipo_solicitacao === 'instalacao' && (app_nome || app_versao || app_link)) {
      // Verificar se já existe registro
      const instalacaoExists = await client.query(
        "SELECT id FROM ordens_instalacoes WHERE ordem_id = $1",
        [ordemId]
      );

      if (instalacaoExists.rows.length > 0) {
        // Atualizar
        await client.query(
          `UPDATE ordens_instalacoes 
           SET app_nome = COALESCE($1, app_nome),
               app_versao = COALESCE($2, app_versao),
               app_link = COALESCE($3, app_link)
           WHERE ordem_id = $4`,
          [app_nome, app_versao, app_link, ordemId]
        );
      } else {
        // Inserir
        await client.query(
          `INSERT INTO ordens_instalacoes (ordem_id, app_nome, app_versao, app_link)
           VALUES ($1, $2, $3, $4)`,
          [ordemId, app_nome || 'Não especificado', app_versao, app_link]
        );
      }
    }

    await client.query('COMMIT');

    console.log('✅ Ordem atualizada com sucesso:', ordemId);

    res.status(200).json({
      success: true,
      message: "Ordem atualizada com sucesso",
      ordem: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Erro ao atualizar ordem:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar ordem",
      error: error.message
    });
  } finally {
    client.release();
  }
};

/**
 * Atualizar status de uma ordem
 * PUT /api/admin/ordens/:id/status
 */
export const atualizarStatusOrdem = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Admin não pode colocar status "Não Concluída" manualmente
    const statusValidos = ['Pendente', 'Em Andamento', 'Concluída'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status inválido. Admin pode usar apenas: Pendente, Em Andamento ou Concluída"
      });
    }

    const query = `
      UPDATE ordens 
      SET status = $1,
          data_finalizacao = CASE WHEN $1 = 'Concluída' THEN NOW() ELSE data_finalizacao END
      WHERE codigo = $2 OR id::text = $2
      RETURNING *
    `;

    const result = await pool.query(query, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ordem não encontrada"
      });
    }

    res.status(200).json({
      success: true,
      message: "Status atualizado com sucesso",
      ordem: result.rows[0]
    });

  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar status",
      error: error.message
    });
  }
};

/**
 * Deletar uma ordem (com CASCADE automático)
 * DELETE /api/admin/ordens/:id
 */
export const deletarOrdem = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deletando ordem:', id);

    // Buscar ID numérico da ordem
    const ordemResult = await pool.query(
      "SELECT id FROM ordens WHERE codigo = $1 OR id::text = $1",
      [id]
    );

    if (ordemResult.rows.length === 0) {
      console.log('❌ Ordem não encontrada:', id);
      return res.status(404).json({
        success: false,
        message: "Ordem não encontrada"
      });
    }

    const ordemId = ordemResult.rows[0].id;
    console.log('✅ Ordem encontrada, deletando ID:', ordemId);

    // Deletar a ordem (CASCADE vai deletar automaticamente os registros relacionados)
    await pool.query("DELETE FROM ordens WHERE id = $1", [ordemId]);

    console.log('✅ Ordem deletada com sucesso');

    res.status(200).json({
      success: true,
      message: "Ordem deletada com sucesso"
    });

  } catch (error) {
    console.error("Erro ao deletar ordem:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao deletar ordem",
      error: error.message
    });
  }
};