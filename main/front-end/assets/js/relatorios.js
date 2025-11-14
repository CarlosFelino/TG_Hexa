// relatorios.js - VERSÃO COMPLETA
document.addEventListener('DOMContentLoaded', function() {
    // =========================
    // Inicialização
    // =========================
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("currentUser"));

    if (!token || !user || user.role !== 'admin') {
        window.location.href = "../../login.html";
        return;
    }

    // =========================
    // Elementos do DOM
    // =========================
    const selectReport = document.getElementById('select-report');
    const selectFormat = document.getElementById('select-format');
    const dateStart = document.getElementById('date-start');
    const dateEnd = document.getElementById('date-end');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const generateReportBtn = document.getElementById('generate-report');
    const reportsHistoryBody = document.getElementById('reports-history-body');

    // Elementos de estatísticas
    const totalOrdersEl = document.getElementById('total-orders');
    const totalUsersEl = document.getElementById('total-users');
    const totalPatrimonioEl = document.getElementById('total-patrimonio');
    const completionRateEl = document.getElementById('completion-rate');

    // =========================
    // Configuração Inicial
    // =========================
    function init() {
        setupEventListeners();
        loadStatistics();
        loadReportsHistory();
        setDefaultDates();
    }

    function setupEventListeners() {
        // Gerar relatório via formulário
        generateReportBtn.addEventListener('click', generateReportFromForm);

        // Gerar relatório via cards
        document.querySelectorAll('.btn-table.download').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reportType = e.currentTarget.dataset.report;
                downloadReport(reportType, 'csv');
            });
        });

        // Visualizar relatório
        document.querySelectorAll('.btn-table.preview').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reportType = e.currentTarget.dataset.report;
                previewReport(reportType);
            });
        });

        // Limpar filtros
        resetFiltersBtn.addEventListener('click', resetFilters);
    }

    function setDefaultDates() {
        // Data início = primeiro dia do mês atual
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        dateStart.value = firstDay.toISOString().split('T')[0];
        
        // Data fim = hoje
        dateEnd.value = today.toISOString().split('T')[0];
    }

    // =========================
    // Carregar Estatísticas
    // =========================
    async function loadStatistics() {
        try {
            // Em produção, faria requisições reais
            // Dados mock para demonstração
            const stats = {
                totalOrders: 156,
                totalUsers: 42,
                totalPatrimonio: 89,
                completionRate: 82
            };

            if (totalOrdersEl) totalOrdersEl.textContent = stats.totalOrders;
            if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers;
            if (totalPatrimonioEl) totalPatrimonioEl.textContent = stats.totalPatrimonio;
            if (completionRateEl) completionRateEl.textContent = `${stats.completionRate}%`;

        } catch (err) {
            console.error("Erro ao carregar estatísticas:", err);
        }
    }

    // =========================
    // Gerar Relatório do Formulário
    // =========================
    async function generateReportFromForm() {
        const reportType = selectReport.value;
        const format = selectFormat.value;
        const startDate = dateStart.value;
        const endDate = dateEnd.value;

        // Validações
        if (!reportType) {
            showCustomAlert('warning', 'Atenção', 'Selecione o tipo de relatório.');
            return;
        }

        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            showCustomAlert('warning', 'Atenção', 'A data de início não pode ser maior que a data de fim.');
            return;
        }

        try {
            generateReportBtn.disabled = true;
            generateReportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';

            // Simular processamento
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Gerar relatório
            await downloadReport(reportType, format, startDate, endDate);

            // Adicionar ao histórico
            addToReportsHistory(reportType, format);
            
            showCustomAlert('success', 'Relatório Gerado', 
                `Relatório ${getReportName(reportType)} gerado com sucesso em formato ${format.toUpperCase()}.`);

        } catch (error) {
            showCustomAlert('error', 'Erro', 'Não foi possível gerar o relatório.');
        } finally {
            generateReportBtn.disabled = false;
            generateReportBtn.innerHTML = '<i class="fas fa-download"></i> Gerar Relatório';
        }
    }

    // =========================
    // Download de Relatório
    // =========================
    async function downloadReport(reportType, format, startDate = null, endDate = null) {
        try {
            // Em produção, faria requisição real
            // const res = await fetch("/api/admin/relatorios/download", {
            //     method: "POST",
            //     headers: { 
            //         "Authorization": `Bearer ${token}`,
            //         "Content-Type": "application/json"
            //     },
            //     body: JSON.stringify({
            //         tipo: reportType,
            //         formato: format,
            //         data_inicio: startDate,
            //         data_fim: endDate
            //     })
            // });

            // Simular download
            const reportName = getReportName(reportType);
            const fileName = `${reportName}_${new Date().toISOString().split('T')[0]}.${format}`;
            
            // Criar conteúdo mock (em produção viria do backend)
            let content = '';
            if (format === 'csv') {
                content = generateMockCSV(reportType);
                downloadFile(content, fileName, 'text/csv');
            } else if (format === 'xlsx') {
                // Em produção, geraria arquivo Excel real
                content = generateMockCSV(reportType);
                downloadFile(content, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            } else if (format === 'pdf') {
                // Em produção, geraria PDF real
                content = 'PDF content would be generated here';
                downloadFile(content, fileName, 'application/pdf');
            }

        } catch (error) {
            throw new Error('Falha ao gerar relatório');
        }
    }

    function generateMockCSV(reportType) {
        const headers = {
            ordens: 'ID,Descrição,Status,Data Criação,Solicitante,Técnico',
            usuarios: 'ID,Nome,Email,Cargo,Status,Data Cadastro',
            patrimonio: 'ID,Número Patrimônio,Descrição,Categoria,Local,Status',
            desempenho: 'Técnico,Ordens Concluídas,Tempo Médio,Avaliação Média',
            matriculas: 'Matrícula,Nome,Email,Status'
        };

        const sampleData = {
            ordens: '\n1,Problema no monitor,Sala 101,Concluída,2024-12-19,Prof. João,Técnico Maria',
            usuarios: '\n1,Prof. Carlos Silva,carlos.silva@fatec.sp.gov.br,Professor,Ativo,2024-01-15',
            patrimonio: '\n1,FATEC-001,Computador Dell,Computador,Sala 101,Em Uso',
            desempenho: '\nTécnico João,45,2.3h,4.8',
            matriculas: '\n20241001,João Silva,joao.silva@fatec.sp.gov.br,Ativo'
        };

        return headers[reportType] + sampleData[reportType];
    }

    function downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    // =========================
    // Visualizar Relatório
    // =========================
    function previewReport(reportType) {
        showCustomAlert('info', 'Pré-visualização', 
            `A pré-visualização do relatório ${getReportName(reportType)} será implementada em breve.`,
            [
                { text: 'Fechar', action: 'secondary' }
            ]
        );
    }

    // =========================
    // Histórico de Relatórios
    // =========================
    function addToReportsHistory(reportType, format) {
        const history = JSON.parse(localStorage.getItem('reportsHistory') || '[]');
        
        const newReport = {
            id: Date.now(),
            nome: getReportName(reportType),
            tipo: reportType,
            formato: format.toUpperCase(),
            data_geracao: new Date().toISOString(),
            tamanho: '1.2 MB'
        };

        history.unshift(newReport);
        localStorage.setItem('reportsHistory', JSON.stringify(history.slice(0, 20))); // Manter últimos 20

        loadReportsHistory();
    }

    function loadReportsHistory() {
        const history = JSON.parse(localStorage.getItem('reportsHistory') || '[]');
        
        if (history.length === 0) {
            reportsHistoryBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-medium);">
                        <i class="fas fa-history" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        Nenhum relatório gerado ainda
                    </td>
                </tr>
            `;
            return;
        }

        reportsHistoryBody.innerHTML = history.map(report => `
            <tr>
                <td><strong>#${report.id}</strong></td>
                <td>${report.nome}</td>
                <td>${report.tipo}</td>
                <td>${report.formato}</td>
                <td>${formatDate(report.data_geracao)}</td>
                <td>${report.tamanho}</td>
                <td>
                    <div class="actions-cell">
                        <button class="btn-table download" data-id="${report.id}" title="Baixar novamente">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn-table delete" data-id="${report.id}" title="Excluir do histórico">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Adicionar event listeners
        document.querySelectorAll('.btn-table.download[data-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reportId = e.currentTarget.dataset.id;
                const report = history.find(r => r.id == reportId);
                if (report) {
                    downloadReport(report.tipo, report.formato.toLowerCase());
                }
            });
        });

        document.querySelectorAll('.btn-table.delete[data-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reportId = e.currentTarget.dataset.id;
                deleteFromHistory(reportId);
            });
        });
    }

    function deleteFromHistory(reportId) {
        showCustomAlert('warning', 'Confirmar Exclusão', 
            'Tem certeza que deseja excluir este relatório do histórico?',
            [
                { text: 'Cancelar', action: 'secondary' },
                { text: 'Excluir', action: 'primary', callback: () => confirmDelete(reportId) }
            ]
        );
    }

    function confirmDelete(reportId) {
        let history = JSON.parse(localStorage.getItem('reportsHistory') || '[]');
        history = history.filter(report => report.id != reportId);
        localStorage.setItem('reportsHistory', JSON.stringify(history));
        loadReportsHistory();
        showCustomAlert('success', 'Excluído', 'Relatório removido do histórico.');
    }

    // =========================
    // Utilitários
    // =========================
    function getReportName(reportType) {
        const names = {
            ordens: 'Ordens de Serviço',
            usuarios: 'Usuários do Sistema',
            patrimonio: 'Patrimônio',
            desempenho: 'Desempenho da Equipe',
            matriculas: 'Matrículas Autorizadas'
        };
        return names[reportType] || reportType;
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function resetFilters() {
        selectReport.value = '';
        selectFormat.value = 'csv';
        setDefaultDates();
    }

    // =========================
    // Sistema de Alertas Padronizado
    // =========================
    function showCustomAlert(type, title, message, buttons = []) {
        const alertOverlay = document.createElement('div');
        alertOverlay.className = `alert-overlay alert-${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const buttonHTML = buttons.length > 0 ? 
            `<div class="alert-actions">
                ${buttons.map(btn => `
                    <button class="alert-btn alert-btn-${btn.action}" data-action="${btn.action}">
                        ${btn.text}
                    </button>
                `).join('')}
            </div>` : '';

        alertOverlay.innerHTML = `
            <div class="alert-modal">
                <div class="alert-icon">
                    <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
                </div>
                <h3 class="alert-title">${title}</h3>
                <div class="alert-message">${message}</div>
                ${buttonHTML}
            </div>
        `;

        document.body.appendChild(alertOverlay);
        
        // Event listeners para botões
        alertOverlay.querySelectorAll('.alert-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.dataset.action;
                const buttonConfig = buttons.find(b => b.text === this.textContent);
                if (buttonConfig && buttonConfig.callback) {
                    buttonConfig.callback();
                }
                alertOverlay.remove();
            });
        });

        // Fechar ao clicar fora ou pressionar ESC
        alertOverlay.addEventListener('click', (e) => {
            if (e.target === alertOverlay) {
                alertOverlay.remove();
            }
        });

        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                alertOverlay.remove();
                document.removeEventListener('keydown', closeOnEscape);
            }
        });

        setTimeout(() => alertOverlay.classList.add('visible'), 10);
    }

    // Iniciar aplicação
    init();
    console.log('✅ Relatórios - Admin inicializado com sucesso!');
});