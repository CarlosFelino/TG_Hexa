// ============================================
// 📊 CONTROLLER DE RELATÓRIOS - SUPPORT NEXUS (CORRIGIDO)
// ============================================

import PDFDocument from 'pdfkit';
import pool from '../config/db.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// 📁 ESTRUTURA DE DIRETÓRIOS
// ============================================
const RELATORIOS_DIR = path.join(__dirname, '../relatorios');
if (!fs.existsSync(RELATORIOS_DIR)) {
  fs.mkdirSync(RELATORIOS_DIR, { recursive: true });
}

// ============================================
// 🎨 FUNÇÕES AUXILIARES PARA PDF
// ============================================

// Cabeçalho padrão dos relatórios
function addHeader(doc, titulo, subtitulo = '') {
  doc.fontSize(20)
     .fillColor('#1a1a2e')
     .text('Support Nexus', 50, 50)
     .fontSize(10)
     .fillColor('#666')
     .text('Sistema de Gestão de Suporte', 50, 75);

  doc.moveTo(50, 95)
     .lineTo(545, 95)
     .strokeColor('#7a04eb')
     .lineWidth(2)
     .stroke();

  doc.fontSize(16)
     .fillColor('#1a1a2e')
     .text(titulo, 50, 110);

  if (subtitulo) {
    doc.fontSize(10)
       .fillColor('#666')
       .text(subtitulo, 50, 130);
  }

  return doc;
}

// Rodapé padrão
function addFooter(doc, pageNumber, totalPages) {
  doc.fontSize(8)
     .fillColor('#999')
     .text(
       `Página ${pageNumber} de ${totalPages} | Gerado em ${new Date().toLocaleString('pt-BR')}`,
       50,
       doc.page.height - 50,
       { align: 'center', width: 500 }
     );
}

// Criar tabela no PDF
function addTable(doc, headers, rows, startY = 160) {
  const tableTop = startY;
  const colWidth = 500 / headers.length;
  let currentY = tableTop;

  // Cabeçalhos
  doc.fontSize(9)
     .fillColor('#fff')
     .rect(50, currentY, 500, 25)
     .fill('#7a04eb');

  headers.forEach((header, i) => {
    doc.fillColor('#fff')
       .text(header, 55 + (i * colWidth), currentY + 8, {
         width: colWidth - 10,
         align: 'left'
       });
  });

  currentY += 25;

  // Linhas
  rows.forEach((row, rowIndex) => {
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
    }

    const bgColor = rowIndex % 2 === 0 ? '#f8f9fa' : '#ffffff';
    doc.rect(50, currentY, 500, 20).fill(bgColor);

    row.forEach((cell, i) => {
      doc.fillColor('#333')
         .fontSize(8)
         .text(String(cell || '-'), 55 + (i * colWidth), currentY + 6, {
           width: colWidth - 10,
           align: 'left'
         });
    });

    currentY += 20;
  });

  return currentY;
}

// ============================================
// 📊 GERAR RELATÓRIO DE ORDENS DE SERVIÇO
// ============================================
export const gerarRelatorioOrdens = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    const userId = req.user.userId;

    let query = `
      SELECT 
        o.id,
        o.codigo,
        o.titulo,
        o.tipo_solicitacao,
        o.status,
        o.prioridade,
        o.local_detalhe,
        o.data_criacao,
        o.data_finalizacao,
        u_criador.nome as criador_nome,
        u_resp.nome as responsavel_nome
      FROM ordens o
      LEFT JOIN users u_criador ON o.criador_id = u_criador.id
      LEFT JOIN users u_resp ON o.responsavel_id = u_resp.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (data_inicio) {
      query += ` AND o.data_criacao >= $${paramCount}`;
      params.push(data_inicio);
      paramCount++;
    }

    if (data_fim) {
      query += ` AND o.data_criacao <= $${paramCount}`;
      params.push(data_fim);
      paramCount++;
    }

    query += ` ORDER BY o.data_criacao DESC`;

    const result = await pool.query(query, params);
    const ordens = result.rows;

    // Criar PDF
    const doc = new PDFDocument({ margin: 50 });
    const fileName = `ordens_${Date.now()}.pdf`;
    const filePath = path.join(RELATORIOS_DIR, fileName);

    // ✅ FIX: Usar array de buffers para calcular tamanho correto
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    // Cabeçalho
    const periodo = data_inicio && data_fim 
      ? `Período: ${new Date(data_inicio).toLocaleDateString('pt-BR')} a ${new Date(data_fim).toLocaleDateString('pt-BR')}`
      : 'Todos os registros';

    addHeader(doc, 'Relatório de Ordens de Serviço', periodo);

    // Estatísticas
    doc.fontSize(10)
       .fillColor('#333')
       .text(`Total de Ordens: ${ordens.length}`, 50, 155);

    // Tabela
    const headers = ['Código', 'Título', 'Tipo', 'Status', 'Prioridade', 'Criador', 'Data'];
    const rows = ordens.map(o => [
      o.codigo,
      o.titulo.substring(0, 30) + (o.titulo.length > 30 ? '...' : ''),
      o.tipo_solicitacao,
      o.status,
      `P${o.prioridade}`,
      o.criador_nome || '-',
      new Date(o.data_criacao).toLocaleDateString('pt-BR')
    ]);

    addTable(doc, headers, rows, 180);
    addFooter(doc, 1, 1);

    doc.end();

    // ✅ FIX: Aguardar finalização e calcular tamanho correto
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);
      const tamanhoBytes = pdfBuffer.length;

      // Salvar arquivo
      fs.writeFileSync(filePath, pdfBuffer);

      // Salvar histórico com tamanho correto
      await salvarHistorico(userId, 'Ordens de Serviço', 'ordens', 'PDF', fileName, tamanhoBytes);

      // ✅ FIX: Enviar como PDF inline para abrir no navegador
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.send(pdfBuffer);
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de ordens:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
};

// ============================================
// 👥 GERAR RELATÓRIO DE USUÁRIOS
// ============================================
export const gerarRelatorioUsuarios = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(`
      SELECT 
        id,
        nome,
        email,
        matricula,
        role,
        criado_em
      FROM users
      ORDER BY criado_em DESC
    `);

    const usuarios = result.rows;

    const doc = new PDFDocument({ margin: 50 });
    const fileName = `usuarios_${Date.now()}.pdf`;
    const filePath = path.join(RELATORIOS_DIR, fileName);

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    addHeader(doc, 'Relatório de Usuários do Sistema', `Total: ${usuarios.length} usuários`);

    const headers = ['ID', 'Nome', 'Email', 'Matrícula', 'Função', 'Cadastro'];
    const rows = usuarios.map(u => [
      u.id,
      u.nome,
      u.email,
      u.matricula,
      u.role,
      new Date(u.criado_em).toLocaleDateString('pt-BR')
    ]);

    addTable(doc, headers, rows, 160);
    addFooter(doc, 1, 1);

    doc.end();

    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);
      fs.writeFileSync(filePath, pdfBuffer);

      await salvarHistorico(userId, 'Usuários do Sistema', 'usuarios', 'PDF', fileName, pdfBuffer.length);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.send(pdfBuffer);
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de usuários:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
};

// ============================================
// 📦 GERAR RELATÓRIO DE PATRIMÔNIO
// ============================================
export const gerarRelatorioPatrimonio = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(`
      SELECT 
        id,
        patrimonio,
        descricao,
        local,
        status
      FROM patrimonios
      ORDER BY patrimonio
    `);

    const patrimonios = result.rows;

    const doc = new PDFDocument({ margin: 50 });
    const fileName = `patrimonio_${Date.now()}.pdf`;
    const filePath = path.join(RELATORIOS_DIR, fileName);

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    addHeader(doc, 'Relatório de Patrimônio', `Total: ${patrimonios.length} itens`);

    const headers = ['ID', 'Patrimônio', 'Descrição', 'Local', 'Status'];
    const rows = patrimonios.map(p => [
      p.id,
      p.patrimonio,
      p.descricao,
      p.local,
      p.status
    ]);

    addTable(doc, headers, rows, 160);
    addFooter(doc, 1, 1);

    doc.end();

    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);
      fs.writeFileSync(filePath, pdfBuffer);

      await salvarHistorico(userId, 'Patrimônio', 'patrimonio', 'PDF', fileName, pdfBuffer.length);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.send(pdfBuffer);
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de patrimônio:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
};

// ============================================
// 🎓 GERAR RELATÓRIO DE MATRÍCULAS
// ============================================
export const gerarRelatorioMatriculas = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(`
      SELECT 
        id,
        matricula,
        role,
        status,
        nome_pre_cadastrado
      FROM matriculas_autorizadas
      ORDER BY matricula
    `);

    const matriculas = result.rows;

    const doc = new PDFDocument({ margin: 50 });
    const fileName = `matriculas_${Date.now()}.pdf`;
    const filePath = path.join(RELATORIOS_DIR, fileName);

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    addHeader(doc, 'Relatório de Matrículas Autorizadas', `Total: ${matriculas.length} matrículas`);

    const headers = ['ID', 'Matrícula', 'Função', 'Status', 'Nome Pré-cadastrado'];
    const rows = matriculas.map(m => [
      m.id,
      m.matricula,
      m.role,
      m.status,
      m.nome_pre_cadastrado || '-'
    ]);

    addTable(doc, headers, rows, 160);
    addFooter(doc, 1, 1);

    doc.end();

    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);
      fs.writeFileSync(filePath, pdfBuffer);

      await salvarHistorico(userId, 'Matrículas Autorizadas', 'matriculas', 'PDF', fileName, pdfBuffer.length);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.send(pdfBuffer);
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de matrículas:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
};

// ============================================
// 📈 GERAR RELATÓRIO DE DESEMPENHO
// ============================================
export const gerarRelatorioDesempenho = async (req, res) => {
  try {
    const { data_inicio, data_fim, tecnico_id } = req.query;
    const userId = req.user.userId;

    // Query base
    let query = `
      SELECT 
        u.id as tecnico_id,
        u.nome as tecnico_nome,
        COUNT(CASE WHEN o.status = 'Concluída' THEN 1 END) as concluidas,
        COUNT(CASE WHEN o.status = 'Não Concluída' THEN 1 END) as nao_concluidas,
        COUNT(*) as total_ordens,
        ROUND(AVG(CASE WHEN o.avaliacao IS NOT NULL THEN o.avaliacao END), 1) as avaliacao_media
      FROM users u
      LEFT JOIN ordens o ON u.id = o.responsavel_id
      WHERE u.role IN ('suporte', 'admin')
    `;

    const params = [];
    let paramCount = 1;

    if (data_inicio) {
      query += ` AND o.data_criacao >= $${paramCount}`;
      params.push(data_inicio);
      paramCount++;
    }

    if (data_fim) {
      query += ` AND o.data_criacao <= $${paramCount}`;
      params.push(data_fim);
      paramCount++;
    }

    if (tecnico_id) {
      query += ` AND u.id = $${paramCount}`;
      params.push(tecnico_id);
      paramCount++;
    }

    query += ` GROUP BY u.id, u.nome ORDER BY concluidas DESC`;

    const result = await pool.query(query, params);
    const desempenho = result.rows;

    // Calcular totais gerais
    const totais = desempenho.reduce((acc, curr) => ({
      concluidas: acc.concluidas + parseInt(curr.concluidas),
      nao_concluidas: acc.nao_concluidas + parseInt(curr.nao_concluidas),
      total_ordens: acc.total_ordens + parseInt(curr.total_ordens)
    }), { concluidas: 0, nao_concluidas: 0, total_ordens: 0 });

    const taxaSucesso = totais.total_ordens > 0 
      ? ((totais.concluidas / totais.total_ordens) * 100).toFixed(1)
      : 0;

    // Criar PDF
    const doc = new PDFDocument({ margin: 50 });
    const fileName = `desempenho_${Date.now()}.pdf`;
    const filePath = path.join(RELATORIOS_DIR, fileName);

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    const periodo = data_inicio && data_fim 
      ? `Período: ${new Date(data_inicio).toLocaleDateString('pt-BR')} a ${new Date(data_fim).toLocaleDateString('pt-BR')}`
      : 'Todos os registros';

    addHeader(doc, 'Relatório de Desempenho da Equipe', periodo);

    // Cards de estatísticas
    doc.fontSize(12)
       .fillColor('#1a1a2e')
       .text('📊 Estatísticas Gerais', 50, 160);

    doc.rect(50, 180, 150, 60).fillAndStroke('#f0f2f5', '#ddd');
    doc.fillColor('#7a04eb')
       .fontSize(24)
       .text(totais.concluidas, 60, 195);
    doc.fillColor('#666')
       .fontSize(10)
       .text('Ordens Concluídas', 60, 225);

    doc.rect(220, 180, 150, 60).fillAndStroke('#f0f2f5', '#ddd');
    doc.fillColor('#f44336')
       .fontSize(24)
       .text(totais.nao_concluidas, 230, 195);
    doc.fillColor('#666')
       .fontSize(10)
       .text('Não Concluídas', 230, 225);

    doc.rect(390, 180, 150, 60).fillAndStroke('#f0f2f5', '#ddd');
    doc.fillColor('#4caf50')
       .fontSize(24)
       .text(`${taxaSucesso}%`, 400, 195);
    doc.fillColor('#666')
       .fontSize(10)
       .text('Taxa de Sucesso', 400, 225);

    // Gráfico simples de barras
    doc.fontSize(12)
       .fillColor('#1a1a2e')
       .text('📊 Desempenho por Técnico', 50, 260);

    let chartY = 290;
    desempenho.forEach((tec) => {
      if (chartY > 650) {
        doc.addPage();
        chartY = 50;
      }

      const maxWidth = 300;
      const concluidasWidth = tec.total_ordens > 0 
        ? (tec.concluidas / tec.total_ordens) * maxWidth 
        : 0;

      doc.fontSize(9)
         .fillColor('#333')
         .text(`${tec.tecnico_nome}`, 50, chartY);

      doc.rect(50, chartY + 15, concluidasWidth, 15)
         .fill('#7a04eb');

      doc.fillColor('#666')
         .fontSize(8)
         .text(`${tec.concluidas}/${tec.total_ordens} (${tec.total_ordens > 0 ? ((tec.concluidas/tec.total_ordens)*100).toFixed(0) : 0}%)`, 
               360, chartY + 17);

      chartY += 40;
    });

    // Tabela detalhada
    doc.addPage();
    addHeader(doc, 'Detalhamento por Técnico', '');

    const headers = ['Técnico', 'Concluídas', 'Não Concluídas', 'Total', 'Taxa %', 'Aval. Média'];
    const rows = desempenho.map(t => [
      t.tecnico_nome,
      t.concluidas,
      t.nao_concluidas,
      t.total_ordens,
      t.total_ordens > 0 ? `${((t.concluidas/t.total_ordens)*100).toFixed(1)}%` : '0%',
      t.avaliacao_media || '-'
    ]);

    addTable(doc, headers, rows, 160);
    addFooter(doc, 2, 2);

    doc.end();

    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);
      fs.writeFileSync(filePath, pdfBuffer);

      await salvarHistorico(userId, 'Desempenho da Equipe', 'desempenho', 'PDF', fileName, pdfBuffer.length);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.send(pdfBuffer);
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de desempenho:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
};

// ============================================
// 📋 OBTER HISTÓRICO DE RELATÓRIOS
// ============================================
export const obterHistorico = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(`
      SELECT 
        id,
        nome_relatorio,
        tipo_relatorio,
        formato,
        data_geracao,
        tamanho_kb,
        arquivo_nome
      FROM relatorios_historico
      WHERE usuario_id = $1
      ORDER BY data_geracao DESC
      LIMIT 50
    `, [userId]);

    res.json({
      success: true,
      historico: result.rows
    });

  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    res.status(500).json({ error: 'Erro ao obter histórico' });
  }
};

// ============================================
// 📊 OBTER ESTATÍSTICAS
// ============================================
export const obterEstatisticas = async (req, res) => {
  try {
    // Total de ordens
    const ordensResult = await pool.query('SELECT COUNT(*) as total FROM ordens');
    const totalOrdens = parseInt(ordensResult.rows[0].total);

    // Total de usuários ativos
    const usuariosResult = await pool.query('SELECT COUNT(*) as total FROM users');
    const totalUsuarios = parseInt(usuariosResult.rows[0].total);

    // Total de patrimônio
    const patrimonioResult = await pool.query('SELECT COUNT(*) as total FROM patrimonios');
    const totalPatrimonio = parseInt(patrimonioResult.rows[0].total);

    // Taxa de conclusão
    const conclusaoResult = await pool.query(`
      SELECT 
        COUNT(CASE WHEN status = 'Concluída' THEN 1 END) as concluidas,
        COUNT(*) as total
      FROM ordens
    `);

    const taxaConclusao = conclusaoResult.rows[0].total > 0
      ? ((conclusaoResult.rows[0].concluidas / conclusaoResult.rows[0].total) * 100).toFixed(0)
      : 0;

    res.json({
      success: true,
      estatisticas: {
        totalOrdens,
        totalUsuarios,
        totalPatrimonio,
        taxaConclusao: `${taxaConclusao}%`
      }
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
};

// ============================================
// 💾 SALVAR HISTÓRICO
// ============================================
async function salvarHistorico(userId, nomeRelatorio, tipoRelatorio, formato, arquivoNome, tamanhoBytes) {
  try {
    const tamanhoKB = (tamanhoBytes / 1024).toFixed(2);

    await pool.query(`
      INSERT INTO relatorios_historico 
        (usuario_id, nome_relatorio, tipo_relatorio, formato, tamanho_kb, arquivo_nome)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [userId, nomeRelatorio, tipoRelatorio, formato, tamanhoKB, arquivoNome]);

  } catch (error) {
    console.error('Erro ao salvar histórico:', error);
  }
}