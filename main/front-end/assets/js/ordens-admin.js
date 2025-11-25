// ordens-admin.js - VERSÃO COMPLETA COM EDIÇÃO E ANEXOS
document.addEventListener('DOMContentLoaded', function() {
    // =========================
    // Inicialização
    // =========================
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("currentUser"));

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
            showLoading();

            const res = await fetch("/api/admin/ordens", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Falha ao carregar ordens");

            const data = await res.json();
            ordersData = data.ordens || [];

            updateStatistics();
            renderOrders();
            hideLoading();

        } catch (err) {
            console.error("Erro ao carregar ordens:", err);
            hideLoading();
            showCustomAlert('error', 'Erro', 'Não foi possível carregar as ordens. Verifique sua conexão.');
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
                        ${order.status !== 'not-completed' ? `
                        <button class="btn-table edit" data-id="${order.id}" title="Editar ordem">
                            <i class="fas fa-edit"></i>
                        </button>
                        ` : ''}
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
    // Mostrar detalhes da ordem (COM ANEXOS)
    // =========================
    async function showOrderDetails(orderId) {
        const order = ordersData.find(o => o.id === orderId);
        if (!order) return;

        let statusText = '';
        switch(order.status) {
            case 'pending': statusText = 'Pendente'; break;
            case 'in-progress': statusText = 'Em Andamento'; break;
            case 'completed': statusText = 'Concluída'; break;
            case 'not-completed': statusText = 'Não Concluída'; break;
        }

        // Buscar anexos
        let anexosHTML = '';
        if (order.total_anexos > 0) {
            try {
                // Encode do ID para URL
                const encodedId = encodeURIComponent(order.id);
                const anexosRes = await fetch(`/api/admin/ordens/${encodedId}/anexos`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (anexosRes.ok) {
                    const anexosData = await anexosRes.json();
                    const anexos = anexosData.anexos || [];

                    if (anexos.length > 0) {
                        anexosHTML = `
                        <div class="detail-item full-width">
                            <label>Anexos (${anexos.length}):</label>
                            <div class="anexos-list">
                                ${anexos.map(anexo => `
                                    <a href="${anexo.url}" target="_blank" class="anexo-item">
                                        <i class="fas fa-paperclip"></i>
                                        ${anexo.nome}
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                        `;
                    }
                }
            } catch (err) {
                console.error('Erro ao buscar anexos:', err);
            }
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
                    <p>${order.descricao_completa || order.descricao}</p>
                </div>
                ${order.observacoes ? `
                <div class="detail-item full-width">
                    <label>Observações:</label>
                    <p>${order.observacoes}</p>
                </div>
                ` : ''}
                ${order.solucao ? `
                <div class="detail-item full-width">
                    <label>Solução:</label>
                    <p>${order.solucao}</p>
                </div>
                ` : ''}
                ${order.avaliacao ? `
                <div class="detail-item">
                    <label>Avaliação:</label>
                    <span>${order.avaliacao}/5 <i class="fas fa-star" style="color: #FFC107;"></i></span>
                </div>
                ` : ''}
                ${anexosHTML}
            </div>
        `;

        modal.classList.add('active');
    }

    // =========================
    // Editar ordem
    // =========================
    function editOrder(orderId) {
        const order = ordersData.find(o => o.id === orderId);
        if (!order) return;

        // Verificar se pode editar
        if (order.status === 'not-completed') {
            showCustomAlert('warning', 'Edição Bloqueada', 'Ordens com status "Não Concluída" não podem ser editadas.');
            return;
        }

        // Criar modal de edição
        const editModal = document.createElement('div');
        editModal.className = 'modal active';
        editModal.id = 'edit-order-modal';

        editModal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>Editar Ordem ${order.id}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="edit-order-form">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Título*</label>
                                <input type="text" name="titulo" value="${order.titulo || ''}" required>
                            </div>

                            <div class="form-group">
                                <label>Tipo de Local*</label>
                                <select name="local_tipo" required>
                                    <option value="sala" ${order.local_tipo === 'sala' ? 'selected' : ''}>Sala</option>
                                    <option value="laboratorio" ${order.local_tipo === 'laboratorio' ? 'selected' : ''}>Laboratório</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Detalhe do Local*</label>
                                <input type="text" name="local_detalhe" value="${order.local_detalhe || ''}" required>
                            </div>

                            <div class="form-group">
                                <label>Status*</label>
                                <select name="status" required>
                                    <option value="Pendente" ${order.status_original === 'Pendente' ? 'selected' : ''}>Pendente</option>
                                    <option value="Em Andamento" ${order.status_original === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option>
                                    <option value="Concluída" ${order.status_original === 'Concluída' ? 'selected' : ''}>Concluída</option>
                                </select>
                            </div>

                            <div class="form-group full-width">
                                <label>Descrição*</label>
                                <textarea name="descricao" rows="4" required>${order.descricao_completa || order.descricao}</textarea>
                            </div>

                            ${order.tipo === 'problema' ? `
                            <div class="form-group">
                                <label>Equipamento</label>
                                <input type="text" name="equipamento" value="${order.equipamento || ''}">
                            </div>
                            <div class="form-group">
                                <label>Tipo do Problema</label>
                                <input type="text" name="tipo_problema" value="${order.tipo_problema || ''}">
                            </div>
                            ` : ''}

                            ${order.tipo === 'instalacao' ? `
                            <div class="form-group">
                                <label>Nome do Aplicativo</label>
                                <input type="text" name="app_nome" value="${order.app_nome || ''}">
                            </div>
                            <div class="form-group">
                                <label>Versão</label>
                                <input type="text" name="app_versao" value="${order.app_versao || ''}">
                            </div>
                            <div class="form-group full-width">
                                <label>Link</label>
                                <input type="url" name="app_link" value="${order.app_link || ''}">
                            </div>
                            ` : ''}

                            <div class="form-group full-width">
                                <label>Observações</label>
                                <textarea name="observacoes" rows="3">${order.observacoes || ''}</textarea>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-edit">Cancelar</button>
                    <button class="btn btn-primary" id="save-edit">
                        <i class="fas fa-save"></i> Salvar Alterações
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(editModal);

        // Event listeners
        editModal.querySelector('.modal-close').addEventListener('click', () => {
            editModal.remove();
        });

        editModal.querySelector('#cancel-edit').addEventListener('click', () => {
            editModal.remove();
        });

        editModal.querySelector('#save-edit').addEventListener('click', async () => {
            await saveOrderEdit(orderId, editModal);
        });
    }

    // =========================
    // Salvar edição da ordem
    // =========================
    async function saveOrderEdit(orderId, modalElement) {
        const form = modalElement.querySelector('#edit-order-form');
        const formData = new FormData(form);

        const data = {};
        formData.forEach((value, key) => {
            if (value) data[key] = value;
        });

        try {
            const res = await fetch(`/api/admin/ordens/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Erro ao atualizar ordem');
            }

            modalElement.remove();
            showCustomAlert('success', 'Sucesso', 'Ordem atualizada com sucesso!');

            // Recarregar ordens
            await fetchAllOrders();

        } catch (err) {
            console.error('Erro ao atualizar ordem:', err);
            showCustomAlert('error', 'Erro', err.message || 'Não foi possível atualizar a ordem.');
        }
    }

    // =========================
    // Deletar ordem
    // =========================
    function deleteOrder(orderId) {
        showCustomAlert('warning', 'Confirmar Exclusão', 
            `Tem certeza que deseja excluir a ordem <strong>${orderId}</strong>? Esta ação não pode ser desfeita.`,
            [
                { text: 'Cancelar', action: 'secondary' },
                { text: 'Excluir', action: 'primary', callback: () => confirmDelete(orderId) }
            ]
        );
    }

    async function confirmDelete(orderId) {
        try {
            // Encode do ID para URL
            const encodedId = encodeURIComponent(orderId);
            const res = await fetch(`/api/admin/ordens/${encodedId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Erro ao excluir ordem');
            }

            showCustomAlert('success', 'Ordem Excluída', `A ordem ${orderId} foi excluída com sucesso.`);

            // Recarregar ordens
            await fetchAllOrders();

        } catch (err) {
            console.error('Erro ao excluir ordem:', err);
            showCustomAlert('error', 'Erro', err.message || 'Não foi possível excluir a ordem.');
        }
    }

    // =========================
    // Sistema de Alertas
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

        const defaultButton = buttons.length === 0 ? 
            '<button class="alert-btn alert-btn-primary" data-action="close">OK</button>' : '';

        const buttonHTML = buttons.length > 0 ? 
            `<div class="alert-actions">
                ${buttons.map(btn => `
                    <button class="alert-btn alert-btn-${btn.action}" data-action="${btn.action}">
                        ${btn.text}
                    </button>
                `).join('')}
            </div>` : `<div class="alert-actions">${defaultButton}</div>`;

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

        alertOverlay.querySelectorAll('.alert-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.dataset.action;
                const buttonConfig = buttons.find(b => b.text === this.textContent.trim());
                if (buttonConfig && buttonConfig.callback) {
                    buttonConfig.callback();
                }
                alertOverlay.remove();
            });
        });

        setTimeout(() => alertOverlay.classList.add('visible'), 10);
    }

    // =========================
    // Loading
    // =========================
    function showLoading() {
        if (!document.getElementById('loading-overlay')) {
            const loading = document.createElement('div');
            loading.id = 'loading-overlay';
            loading.innerHTML = '<div class="spinner"></div>';
            document.body.appendChild(loading);
        }
    }

    function hideLoading() {
        const loading = document.getElementById('loading-overlay');
        if (loading) loading.remove();
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

        paginationHTML += `
            <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }

        paginationHTML += `
            <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationEl.innerHTML = paginationHTML;

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
        return text && text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR');
    }

    // =========================
    // Inicialização
    // =========================
    function init() {
        fetchAllOrders();

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

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                modal.classList.remove('active');
            }
        });
    }

    init();

    console.log('✅ Gerenciar Ordens - Admin inicializado com sucesso!');
});