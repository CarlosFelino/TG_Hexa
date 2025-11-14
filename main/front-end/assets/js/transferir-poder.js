// transferir-poder.js - VERSÃO PADRONIZADA
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
    const selectUser = document.getElementById('select-user');
    const transferTypeRadios = document.querySelectorAll('input[name="transfer-type"]');
    const endDateField = document.getElementById('date-field');
    const endDateInput = document.getElementById('end-date');
    const confirmBtn = document.getElementById('confirm-btn');
    const transfersTableBody = document.getElementById('transfers-table-body');

    // =========================
    // Configuração Inicial
    // =========================
    function init() {
        setupEventListeners();
        loadSupportUsers();
        loadTransfersHistory();
        setMinDate();
    }

    function setupEventListeners() {
        // Mostrar/ocultar campo de data
        transferTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'temporario') {
                    endDateField.style.display = 'block';
                } else {
                    endDateField.style.display = 'none';
                }
            });
        });

        // Confirmar transferência
        confirmBtn.addEventListener('click', confirmTransfer);
    }

    function setMinDate() {
        // Data mínima = hoje
        const today = new Date().toISOString().split('T')[0];
        endDateInput.min = today;
    }

    // =========================
    // Carregar Usuários do Suporte
    // =========================
    async function loadSupportUsers() {
        try {
            // Em produção, faria requisição real
            // const res = await fetch("/api/users/suporte", {
            //     headers: { "Authorization": `Bearer ${token}` }
            // });
            
            // Dados mock
            const users = [
                { id: 2, nome: 'Técnico João Souza', email: 'joao.souza@fatec.sp.gov.br' },
                { id: 3, nome: 'Técnica Maria Santos', email: 'maria.santos@fatec.sp.gov.br' },
                { id: 4, nome: 'Suporte Carlos Lima', email: 'carlos.lima@fatec.sp.gov.br' }
            ];

            selectUser.innerHTML = '<option value="">Selecionar usuário do suporte</option>';
            users.forEach(user => {
                selectUser.innerHTML += `<option value="${user.id}">${user.nome} (${user.email})</option>`;
            });

        } catch (err) {
            console.error("Erro ao carregar usuários:", err);
            showCustomAlert('error', 'Erro', 'Não foi possível carregar a lista de usuários.');
        }
    }

    // =========================
    // Carregar Histórico
    // =========================
    async function loadTransfersHistory() {
        try {
            // Em produção, faria requisição real
            // const res = await fetch("/api/admin/transferencias", {
            //     headers: { "Authorization": `Bearer ${token}` }
            // });
            
            // Dados mock
            const transfers = [
                {
                    id: 1,
                    usuario: 'Técnico João Souza',
                    tipo: 'Temporário',
                    data_fim: '2024-12-31',
                    status: 'active'
                },
                {
                    id: 2,
                    usuario: 'Técnica Maria Santos',
                    tipo: 'Permanente',
                    data_fim: null,
                    status: 'active'
                },
                {
                    id: 3,
                    usuario: 'Suporte Carlos Lima',
                    tipo: 'Temporário',
                    data_fim: '2024-11-15',
                    status: 'expired'
                }
            ];

            renderTransfersTable(transfers);

        } catch (err) {
            console.error("Erro ao carregar histórico:", err);
            showCustomAlert('error', 'Erro', 'Não foi possível carregar o histórico de transferências.');
        }
    }

    function renderTransfersTable(transfers) {
        if (transfers.length === 0) {
            transfersTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-medium);">
                        <i class="fas fa-history" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        Nenhuma transferência realizada
                    </td>
                </tr>
            `;
            return;
        }

        transfersTableBody.innerHTML = transfers.map(transfer => {
            const statusText = transfer.status === 'active' ? 'Ativo' : 
                             transfer.status === 'expired' ? 'Expirado' : 'Pendente';
            
            const dataFim = transfer.data_fim ? formatDate(transfer.data_fim) : '-';

            return `
                <tr>
                    <td><strong>#${transfer.id}</strong></td>
                    <td>${transfer.usuario}</td>
                    <td>${transfer.tipo}</td>
                    <td>${dataFim}</td>
                    <td><span class="status-badge ${transfer.status}">${statusText}</span></td>
                    <td>
                        <div class="actions-cell">
                            ${transfer.status === 'active' ? `
                            <button class="btn-table revoke" data-id="${transfer.id}" title="Revogar acesso">
                                <i class="fas fa-times"></i>
                            </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Adicionar event listeners aos botões
        document.querySelectorAll('.btn-table.revoke').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const transferId = e.currentTarget.dataset.id;
                revokeTransfer(transferId);
            });
        });
    }

    // =========================
    // Confirmar Transferência
    // =========================
    async function confirmTransfer() {
        const userId = selectUser.value;
        const transferType = document.querySelector('input[name="transfer-type"]:checked').value;
        const endDate = transferType === 'temporario' ? endDateInput.value : null;

        // Validações
        if (!userId) {
            showCustomAlert('warning', 'Atenção', 'Selecione um usuário do suporte.');
            return;
        }

        if (transferType === 'temporario' && !endDate) {
            showCustomAlert('warning', 'Atenção', 'Selecione a data de término para transferência temporária.');
            return;
        }

        try {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

            // Simular requisição
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Em produção, faria:
            // const res = await fetch("/api/admin/transferir-poder", {
            //     method: "POST",
            //     headers: { 
            //         "Authorization": `Bearer ${token}`,
            //         "Content-Type": "application/json"
            //     },
            //     body: JSON.stringify({
            //         user_id: userId,
            //         tipo: transferType,
            //         data_fim: endDate
            //     })
            // });

            showCustomAlert('success', 'Sucesso', 
                `Permissões de administrador transferidas com sucesso para ${selectUser.options[selectUser.selectedIndex].text}.`);

            // Limpar formulário
            selectUser.value = '';
            document.querySelector('input[name="transfer-type"][value="permanente"]').checked = true;
            endDateField.style.display = 'none';
            endDateInput.value = '';

            // Recarregar histórico
            loadTransfersHistory();

        } catch (error) {
            showCustomAlert('error', 'Erro', 'Não foi possível realizar a transferência.');
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-bolt"></i> Confirmar Transferência';
        }
    }

    // =========================
    // Revogar Transferência
    // =========================
    function revokeTransfer(transferId) {
        showCustomAlert('warning', 'Confirmar Revogação', 
            'Tem certeza que deseja revogar as permissões de administrador deste usuário?',
            [
                { text: 'Cancelar', action: 'secondary' },
                { text: 'Revogar', action: 'primary', callback: () => confirmRevoke(transferId) }
            ]
        );
    }

    function confirmRevoke(transferId) {
        // Simular revogação
        console.log(`Revogando transferência: ${transferId}`);
        showCustomAlert('success', 'Permissões Revogadas', 'As permissões de administrador foram revogadas com sucesso.');
        
        // Recarregar histórico
        loadTransfersHistory();
    }

    // =========================
    // Utilitários
    // =========================
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR');
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
    console.log('✅ Transferir Poder - Admin inicializado com sucesso!');
});