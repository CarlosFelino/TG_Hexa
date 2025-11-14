// ordens-admin.js
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
    const ordersTableBody = document.getElementById('orders-table-body');
    const searchInput = document.getElementById('search-orders');
    const filterStatus = document.getElementById('filter-status');
    const filterType = document.getElementById('filter-type');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const exportBtn = document.getElementById('export-orders');
    const modal = document.getElementById('order-details-modal');
    const modalCloseBtns = document.querySelectorAll('.modal-close, .modal-close-btn');
    const editOrderBtn = document.getElementById('edit-order-btn');

    // Elementos de estatísticas
    const totalPendingEl = document.getElementById('total-pending');
    const totalInProgressEl = document.getElementById('total-in-progress');
    const totalCompletedEl = document.getElementById('total-completed');
    const totalOrdersEl = document.getElementById('total-orders');

    // Filtros ativos
    let activeFilters = {
        search: '',
        status: '',
        type: ''
    };

    let ordersData = [];
    let currentPage = 1;
    const itemsPerPage = 10;

    // =========================
    // Buscar ordens do backend
    // =========================
    async function fetchAllOrders() {
        try {
            const res = await fetch("/api/admin/ordens", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            
            if (!res.ok) throw new Error("Falha ao carregar ordens");
            
            const data = await res.json();
            ordersData = data.ordens || [];
            
            updateStatistics();
            renderOrders();
            
        } catch (err) {
            console.error("Erro ao carregar ordens:", err);
            // Dados mock para demonstração
            ordersData = getMockOrders();
            updateStatistics();
            renderOrders();
        }
    }

    // =========================
    // Atualizar estatísticas
    // =========================
    function updateStatistics() {
        const pending = ordersData.filter(o => o.status === 'pending').length;
        const inProgress = ordersData.filter(o => o.status === 'in-progress').length;
        const completed = ordersData.filter(o => o.status === 'completed').length;
        const total = ordersData.length;

        if (totalPendingEl) totalPendingEl.textContent = pending;
        if (totalInProgressEl) totalInProgressEl.textContent = inProgress;
        if (totalCompletedEl) totalCompletedEl.textContent = completed;
        if (totalOrdersEl) totalOrdersEl.textContent = total;
    }

    // =========================
    // Renderizar tabela
    // =========================
    function renderOrders() {
        let filteredOrders = [...ordersData];

        // Aplicar filtros
        if (activeFilters.search) {
            const searchTerm = activeFilters.search.toLowerCase();
            filteredOrders = filteredOrders.filter(order => 
                order.id.toLowerCase().includes(searchTerm) ||
                order.solicitante.toLowerCase().includes(searchTerm) ||
                order.descricao.toLowerCase().includes(searchTerm) ||
                order.local.toLowerCase().includes(searchTerm)
            );
        }

        if (activeFilters.status) {
            filteredOrders = filteredOrders.filter(order => order.status === activeFilters.status);
        }

        if (activeFilters.type) {
            filteredOrders = filteredOrders.filter(order => order.tipo === activeFilters.type);
        }

        // Paginação
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

        // Renderizar tabela
        ordersTableBody.innerHTML = '';

        if (paginatedOrders.length === 0) {
            ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-medium);">
                        <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        Nenhuma ordem encontrada com os filtros atuais
                    </td>
                </tr>
            `;
            return;
        }

        paginatedOrders.forEach(order => {
            const row = document.createElement('tr');
            
            let statusText = '', statusClass = '';
            switch(order.status) {
                case 'pending': statusText = 'Pendente'; statusClass = 'pending'; break;
                case 'in-progress': statusText = 'Em Andamento'; statusClass = 'in-progress'; break;
                case 'completed': statusText = 'Concluída'; statusClass = 'completed'; break;
                case 'not-completed': statusText = 'Não Concluída'; statusClass = 'not-completed'; break;
            }

            row.innerHTML = `
                <td><strong>${order.id}</strong></td>
                <td>${order.solicitante}</td>
                <td>${order.local}</td>
                <td title="${order.descricao}">${truncateText(order.descricao, 50)}</td>
                <td>${formatDate(order.data)}</td>
                <td>${order.tecnico || 'Não atribuído'}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="actions-cell">
                        <button class="btn-table view" data-id="${order.id}" title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-table edit" data-id="${order.id}" title="Editar ordem">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-table delete" data-id="${order.id}" title="Excluir ordem">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            ordersTableBody.appendChild(row);
        });

        // Adicionar event listeners aos botões
        addTableEventListeners();
        renderPagination(filteredOrders.length);
    }

    // =========================
    // Event Listeners da Tabela
    // =========================
    function addTableEventListeners() {
        // Botão Ver
        document.querySelectorAll('.btn-table.view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.currentTarget.dataset.id;
                showOrderDetails(orderId);
            });
        });

        // Botão Editar
        document.querySelectorAll('.btn-table.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.currentTarget.dataset.id;
                editOrder(orderId);
            });
        });

        // Botão Excluir
        document.querySelectorAll('.btn-table.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.currentTarget.dataset.id;
                deleteOrder(orderId);
            });
        });
    }

    // =========================
    // Funções de Ação
    // =========================
    function showOrderDetails(orderId) {
        const order = ordersData.find(o => o.id === orderId);
        if (!order) return;

        let statusText = '';
        switch(order.status) {
            case 'pending': statusText = 'Pendente'; break;
            case 'in-progress': statusText = 'Em Andamento'; break;
            case 'completed': statusText = 'Concluída'; break;
            case 'not-completed': statusText = 'Não Concluída'; break;
        }

        document.getElementById('modal-order-details').innerHTML = `
            <div class="detail-grid">
                <div class="detail-item">
                    <label>ID da Ordem:</label>
                    <span>${order.id}</span>
                </div>
                <div class="detail-item">
                    <label>Solicitante:</label>
                    <span>${order.solicitante}</span>
                </div>
                <div class="detail-item">
                    <label>Email:</label>
                    <span>${order.email}</span>
                </div>
                <div class="detail-item">
                    <label>Local:</label>
                    <span>${order.local}</span>
                </div>
                <div class="detail-item">
                    <label>Tipo:</label>
                    <span>${order.tipo === 'problema' ? 'Problema Técnico' : 'Instalação'}</span>
                </div>
                <div class="detail-item">
                    <label>Equipamento:</label>
                    <span>${order.equipamento || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <label>Status:</label>
                    <span class="status-badge ${order.status}">${statusText}</span>
                </div>
                <div class="detail-item">
                    <label>Técnico:</label>
                    <span>${order.tecnico || 'Não atribuído'}</span>
                </div>
                <div class="detail-item">
                    <label>Data de Criação:</label>
                    <span>${formatDate(order.data)}</span>
                </div>
                <div class="detail-item full-width">
                    <label>Descrição:</label>
                    <p>${order.descricao}</p>
                </div>
                ${order.avaliacao ? `
                <div class="detail-item">
                    <label>Avaliação:</label>
                    <span>${order.avaliacao}/5 <i class="fas fa-star" style="color: #FFC107;"></i></span>
                </div>
                ` : ''}
            </div>
        `;

        modal.classList.add('active');
    }

    function editOrder(orderId) {
        // Implementar edição da ordem
        showCustomAlert('info', 'Editar Ordem', `Função de edição para a ordem ${orderId} será implementada em breve.`);
    }

    function deleteOrder(orderId) {
        showCustomAlert('warning', 'Confirmar Exclusão', 
            `Tem certeza que deseja excluir a ordem <strong>${orderId}</strong>? Esta ação não pode ser desfeita.`,
            [
                { text: 'Cancelar', action: 'secondary' },
                { text: 'Excluir', action: 'primary', callback: () => confirmDelete(orderId) }
            ]
        );
    }

    function confirmDelete(orderId) {
        // Simular exclusão
        console.log(`Excluindo ordem: ${orderId}`);
        showCustomAlert('success', 'Ordem Excluída', `A ordem ${orderId} foi excluída com sucesso.`);
        
        // Atualizar lista (em produção, faria nova requisição)
        ordersData = ordersData.filter(order => order.id !== orderId);
        updateStatistics();
        renderOrders();
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

    // =========================
    // Paginação
    // =========================
    function renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const paginationEl = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            paginationEl.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Botão anterior
        paginationHTML += `
            <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Páginas
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }

        // Botão próximo
        paginationHTML += `
            <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationEl.innerHTML = paginationHTML;

        // Event listeners da paginação
        paginationEl.querySelectorAll('.pagination-btn:not(:disabled)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentPage = parseInt(e.currentTarget.dataset.page);
                renderOrders();
            });
        });
    }

    // =========================
    // Utilitários
    // =========================
    function truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR');
    }

    // =========================
    // Dados Mock (para demonstração)
    // =========================
    function getMockOrders() {
        return [
            {
                id: 'ORD-2024-00123',
                solicitante: 'Prof. Carlos Silva',
                email: 'carlos.silva@fatec.sp.gov.br',
                local: 'Sala 101',
                descricao: 'Monitor do kit professor não está ligando. Verificar conexões de energia e vídeo.',
                data: '2024-01-15',
                tipo: 'problema',
                equipamento: 'Kit Professor',
                status: 'pending',
                tecnico: null,
                avaliacao: null
            },
            {
                id: 'ORD-2024-00124',
                solicitante: 'Prof. Maria Oliveira',
                email: 'maria.oliveira@fatec.sp.gov.br',
                local: 'Laboratório 202',
                descricao: 'Solicitação de instalação do Visual Studio Code para atividades de programação.',
                data: '2024-01-14',
                tipo: 'instalacao',
                equipamento: null,
                status: 'in-progress',
                tecnico: 'João Técnico',
                avaliacao: null
            },
            {
                id: 'ORD-2024-00125',
                solicitante: 'Prof. João Santos',
                email: 'joao.santos@fatec.sp.gov.br',
                local: 'Sala 305',
                descricao: 'Problema de conectividade na TV. Não está recebendo sinal do computador.',
                data: '2024-01-13',
                tipo: 'problema',
                equipamento: 'TV',
                status: 'completed',
                tecnico: 'Ana Técnica',
                avaliacao: 5
            },
            {
                id: 'ORD-2024-00126',
                solicitante: 'Prof. Ana Costa',
                email: 'ana.costa@fatec.sp.gov.br',
                local: 'Laboratório 205',
                descricao: 'Mouse com defeito no computador 3 do laboratório.',
                data: '2024-01-12',
                tipo: 'problema',
                equipamento: 'Periféricos',
                status: 'not-completed',
                tecnico: 'Pedro Técnico',
                avaliacao: null
            }
        ];
    }

    // =========================
    // Inicialização
    // =========================
    function init() {
        fetchAllOrders();

        // Event listeners dos filtros
        searchInput.addEventListener('input', (e) => {
            activeFilters.search = e.target.value;
            currentPage = 1;
            renderOrders();
        });

        filterStatus.addEventListener('change', (e) => {
            activeFilters.status = e.target.value;
            currentPage = 1;
            renderOrders();
        });

        filterType.addEventListener('change', (e) => {
            activeFilters.type = e.target.value;
            currentPage = 1;
            renderOrders();
        });

        resetFiltersBtn.addEventListener('click', () => {
            searchInput.value = '';
            filterStatus.value = '';
            filterType.value = '';
            activeFilters = { search: '', status: '', type: '' };
            currentPage = 1;
            renderOrders();
        });

        exportBtn.addEventListener('click', () => {
            showCustomAlert('info', 'Exportar Ordens', 'A funcionalidade de exportação será implementada em breve.');
        });

        // Event listeners do modal
        modalCloseBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });

        editOrderBtn.addEventListener('click', () => {
            showCustomAlert('info', 'Editar Ordem', 'O editor de ordens será implementado em breve.');
        });

        // Fechar modal com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                modal.classList.remove('active');
            }
        });
    }

    // Iniciar aplicação
    init();

    console.log('✅ Gerenciar Ordens - Admin inicializado com sucesso!');
});