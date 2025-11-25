// ============================================
// 📊 RELATÓRIOS - VERSÃO CORRIGIDA
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // =========================
    // Inicialização
    // =========================
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("currentUser"));

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
        loadStatistics(); // ✅ Carrega estatísticas REAIS
        loadReportsHistory();
        setDefaultDates();
        updateReportMetaCards(); // ✅ Atualiza contadores dos cards
    }

    function setupEventListeners() {
        // Gerar relatório via formulário
        generateReportBtn.addEventListener('click', generateReportFromForm);

        // Gerar relatório via cards
        document.querySelectorAll('.btn-table.download').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reportType = e.currentTarget.dataset.report;
                downloadReport(reportType);
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
    // ✅ CARREGAR ESTATÍSTICAS REAIS DO BACKEND
    // =========================
    async function loadStatistics() {
        try {
            const res = await fetch('/api/admin/relatorios/estatisticas', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) throw new Error('Erro ao carregar estatísticas');

            const data = await res.json();
            const stats = data.estatisticas;

            // ✅ Atualizar elementos do DOM com dados REAIS
            if (totalOrdersEl) totalOrdersEl.textContent = stats.totalOrdens;
            if (totalUsersEl) totalUsersEl.textContent = stats.totalUsuarios;
            if (totalPatrimonioEl) totalPatrimonioEl.textContent = stats.totalPatrimonio;
            if (completionRateEl) completionRateEl.textContent = stats.taxaConclusao;

            console.log('✅ Estatísticas carregadas:', stats);

        } catch (err) {
            console.error("❌ Erro ao carregar estatísticas:", err);
            showCustomAlert('error', 'Erro', 'Não foi possível carregar as estatísticas.');
        }
    }

    // =========================
    // ✅ ATUALIZAR CONTADORES DOS CARDS DE RELATÓRIOS
    // =========================
    async function updateReportMetaCards() {
        try {
            const res = await fetch('/api/admin/relatorios/estatisticas', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) return;

            const data = await res.json();
            const stats = data.estatisticas;

            // Atualizar os cards de "Relatórios Disponíveis"
            const reportCards = document.querySelectorAll('.report-card');

            reportCards.forEach(card => {
                const metaSpans = card.querySelectorAll('.report-meta span');
                const reportType = card.querySelector('.btn-table.download')?.dataset.report;

                if (metaSpans[0] && reportType) {
                    let count = 0;

                    switch(reportType) {
                        case 'ordens':
                            count = stats.totalOrdens;
                            break;
                        case 'usuarios':
                            count = stats.totalUsuarios;
                            break;
                        case 'patrimonio':
                            count = stats.totalPatrimonio;
                            break;
                        case 'matriculas':
                            // Buscar contagem real de matrículas
                            count = '...';
                            break;
                        case 'desempenho':
                            count = stats.totalUsuarios; // Técnicos
                            break;
                    }

                    metaSpans[0].innerHTML = `<i class="fas fa-database"></i> ${count} registros`;
                }
            });

        } catch (err) {
            console.error("Erro ao atualizar cards:", err);
        }
    }

    // =========================
    // Gerar Relatório do Formulário
    // =========================
    async function generateReportFromForm() {
        const reportType = selectReport.value;
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

            await downloadReport(reportType, startDate, endDate);

            showCustomAlert('success', 'Relatório Gerado', 
                `Relatório ${getReportName(reportType)} gerado com sucesso! O PDF foi aberto em uma nova aba.`);

            // Recarregar histórico
            await loadReportsHistory();

        } catch (error) {
            showCustomAlert('error', 'Erro', error.message || 'Não foi possível gerar o relatório.');
        } finally {
            generateReportBtn.disabled = false;
            generateReportBtn.innerHTML = '<i class="fas fa-download"></i> Gerar Relatório';
        }
    }

    // =========================
    // ✅ DOWNLOAD/VISUALIZAÇÃO DE RELATÓRIO (ABRE EM NOVA ABA)
    // =========================
    async function downloadReport(reportType, startDate = null, endDate = null) {
        try {
            // Construir URL com query params
            let url = `/api/admin/relatorios/${reportType}`;
            const params = new URLSearchParams();

            if (startDate) params.append('data_inicio', startDate);
            if (endDate) params.append('data_fim', endDate);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const res = await fetch(url, {
                method: 'GET',
                headers: { 
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Erro ao gerar relatório');
            }

            // ✅ FIX: Receber o PDF como blob e abrir em nova aba
            const blob = await res.blob();
            const pdfUrl = window.URL.createObjectURL(blob);

            // ✅ Abrir PDF em nova aba
            window.open(pdfUrl, '_blank');

            // ✅ Limpar URL após alguns segundos (opcional)
            setTimeout(() => {
                window.URL.revokeObjectURL(pdfUrl);
            }, 10000);

            console.log('✅ PDF gerado e aberto em nova aba');

        } catch (error) {
            console.error('❌ Erro ao gerar relatório:', error);
            throw error;
        }
    }

    // =========================
    // Visualizar Relatório
    // =========================
    function previewReport(reportType) {
        // Chama a função de download que já abre em nova aba
        downloadReport(reportType);
    }

    // =========================
    // ✅ HISTÓRICO DE RELATÓRIOS REAL DO BACKEND
    // =========================
    async function loadReportsHistory() {
        try {
            const res = await fetch('/api/admin/relatorios/historico', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) throw new Error('Erro ao carregar histórico');

            const data = await res.json();
            const history = data.historico;

            if (!history || history.length === 0) {
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
                    <td>${report.nome_relatorio}</td>
                    <td>${report.tipo_relatorio}</td>
                    <td>${report.formato}</td>
                    <td>${formatDate(report.data_geracao)}</td>
                    <td>${report.tamanho_kb} KB</td>
                    <td>
                        <div class="actions-cell">
                            <button class="btn-table download" data-tipo="${report.tipo_relatorio}" title="Visualizar/Baixar">
                                <i class="fas fa-download"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');

            // Adicionar event listeners para re-download
            document.querySelectorAll('.btn-table.download[data-tipo]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tipoRelatorio = e.currentTarget.dataset.tipo;
                    downloadReport(tipoRelatorio);
                });
            });

            console.log('✅ Histórico carregado:', history.length, 'relatórios');

        } catch (error) {
            console.error('❌ Erro ao carregar histórico:', error);
            showCustomAlert('error', 'Erro', 'Não foi possível carregar o histórico de relatórios.');
        }
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
        selectFormat.value = 'pdf';
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
            </div>` : 
            `<div class="alert-actions">
                <button class="alert-btn alert-btn-primary" data-action="close">OK</button>
            </div>`;

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
                const buttonConfig = buttons.find(b => b.action === action);
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