// patrimonio-listar.js
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
    const patrimonioTableBody = document.getElementById('patrimonio-table-body');
    const searchInput = document.getElementById('search-patrimonio');
    const filterStatus = document.getElementById('filter-status');
    const filterCategory = document.getElementById('filter-category');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const addItemBtn = document.getElementById('add-item-btn');
    const exportBtn = document.getElementById('export-patrimonio');
    
    // Modais
    const itemDetailsModal = document.getElementById('item-details-modal');
    const modalCloseBtns = document.querySelectorAll('.modal-close, .modal-close-btn');
    
    // Elementos de ação
    const editItemBtn = document.getElementById('edit-item-btn');

    // Elementos de estatísticas
    const totalItemsEl = document.getElementById('total-items');
    const totalActiveEl = document.getElementById('total-active');
    const totalAvailableEl = document.getElementById('total-available');
    const totalMaintenanceEl = document.getElementById('total-maintenance');

    // Filtros ativos
    let activeFilters = {
        search: '',
        status: '',
        category: ''
    };

    let patrimonioData = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let currentEditingItemId = null;

    // =========================
    // Buscar itens do backend
    // =========================
    async function fetchAllPatrimonio() {
        try {
            const res = await fetch("/api/admin/patrimonio", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            
            if (!res.ok) throw new Error("Falha ao carregar itens do patrimônio");
            
            const data = await res.json();
            patrimonioData = data.itens || [];
            
            updateStatistics();
            renderPatrimonio();
            
        } catch (err) {
            console.error("Erro ao carregar patrimônio:", err);
            // Dados mock para demonstração
            patrimonioData = getMockPatrimonio();
            updateStatistics();
            renderPatrimonio();
        }
    }

    // =========================
    // Atualizar estatísticas
    // =========================
    function updateStatistics() {
        const total = patrimonioData.length;
        const active = patrimonioData.filter(item => item.status === 'active').length;
        const available = patrimonioData.filter(item => item.status === 'available').length;
        const maintenance = patrimonioData.filter(item => item.status === 'maintenance').length;

        if (totalItemsEl) totalItemsEl.textContent = total;
        if (totalActiveEl) totalActiveEl.textContent = active;
        if (totalAvailableEl) totalAvailableEl.textContent = available;
        if (totalMaintenanceEl) totalMaintenanceEl.textContent = maintenance;
    }

    // =========================
    // Renderizar tabela
    // =========================
    function renderPatrimonio() {
        let filteredItems = [...patrimonioData];

        // Aplicar filtros
        if (activeFilters.search) {
            const searchTerm = activeFilters.search.toLowerCase();
            filteredItems = filteredItems.filter(item => 
                item.descricao.toLowerCase().includes(searchTerm) ||
                item.numero_patrimonio.toLowerCase().includes(searchTerm) ||
                item.local.toLowerCase().includes(searchTerm) ||
                item.id.toString().includes(searchTerm)
            );
        }

        if (activeFilters.status) {
            filteredItems = filteredItems.filter(item => item.status === activeFilters.status);
        }

        if (activeFilters.category) {
            filteredItems = filteredItems.filter(item => item.categoria === activeFilters.category);
        }

        // Paginação
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

        // Renderizar tabela
        patrimonioTableBody.innerHTML = '';

        if (paginatedItems.length === 0) {
            patrimonioTableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-medium);">
                        <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        Nenhum item encontrado com os filtros atuais
                    </td>
                </tr>
            `;
            return;
        }

        paginatedItems.forEach(item => {
            const row = document.createElement('tr');
            
            // Textos para badges
            const statusText = getStatusText(item.status);
            const categoryText = getCategoryText(item.categoria);

            row.innerHTML = `
                <td><strong>#${item.id}</strong></td>
                <td>${item.numero_patrimonio}</td>
                <td>${item.descricao}</td>
                <td><span class="category-badge ${item.categoria}">${categoryText}</span></td>
                <td>${item.local}</td>
                <td><span class="status-badge ${item.status}">${statusText}</span></td>
                <td>${formatDate(item.data_aquisicao)}</td>
                <td>
                    <div class="actions-cell">
                        <button class="btn-table view" data-id="${item.id}" title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-table edit" data-id="${item.id}" title="Editar item">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-table delete" data-id="${item.id}" title="Excluir item">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            patrimonioTableBody.appendChild(row);
        });

        // Adicionar event listeners aos botões
        addTableEventListeners();
        renderPagination(filteredItems.length);
    }

    // =========================
    // Event Listeners da Tabela
    // =========================
    function addTableEventListeners() {
        // Botão Ver
        document.querySelectorAll('.btn-table.view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.currentTarget.dataset.id;
                showItemDetails(itemId);
            });
        });

        // Botão Editar
        document.querySelectorAll('.btn-table.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.currentTarget.dataset.id;
                editItem(itemId);
            });
        });

        // Botão Excluir
        document.querySelectorAll('.btn-table.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.currentTarget.dataset.id;
                deleteItem(itemId);
            });
        });
    }

    // =========================
    // Funções de Ação
    // =========================
    function showItemDetails(itemId) {
        const item = patrimonioData.find(i => i.id === itemId);
        if (!item) return;

        const statusText = getStatusText(item.status);
        const categoryText = getCategoryText(item.categoria);

        document.getElementById('modal-item-details').innerHTML = `
            <div class="detail-grid">
                <div class="detail-item">
                    <label>ID:</label>
                    <span>#${item.id}</span>
                </div>
                <div class="detail-item">
                    <label>Número de Patrimônio:</label>
                    <span>${item.numero_patrimonio}</span>
                </div>
                <div class="detail-item">
                    <label>Descrição:</label>
                    <span>${item.descricao}</span>
                </div>
                <div class="detail-item">
                    <label>Categoria:</label>
                    <span class="category-badge ${item.categoria}">${categoryText}</span>
                </div>
                <div class="detail-item">
                    <label>Local:</label>
                    <span>${item.local}</span>
                </div>
                <div class="detail-item">
                    <label>Status:</label>
                    <span class="status-badge ${item.status}">${statusText}</span>
                </div>
                <div class="detail-item">
                    <label>Data de Aquisição:</label>
                    <span>${formatDate(item.data_aquisicao)}</span>
                </div>
                <div class="detail-item">
                    <label>Fornecedor:</label>
                    <span>${item.fornecedor || 'Não informado'}</span>
                </div>
                <div class="detail-item">
                    <label>Nota Fiscal:</label>
                    <span>${item.nota_fiscal || 'Não informada'}</span>
                </div>
                <div class="detail-item">
                    <label>Valor:</label>
                    <span>${item.valor ? formatCurrency(item.valor) : 'Não informado'}</span>
                </div>
                <div class="detail-item full-width">
                    <label>Observações:</label>
                    <p>${item.observacoes || 'Nenhuma observação cadastrada.'}</p>
                </div>
                ${item.ultima_manutencao ? `
                <div class="detail-item">
                    <label>Última Manutenção:</label>
                    <span>${formatDate(item.ultima_manutencao)}</span>
                </div>
                ` : ''}
                ${item.proxima_manutencao ? `
                <div class="detail-item">
                    <label>Próxima Manutenção:</label>
                    <span>${formatDate(item.proxima_manutencao)}</span>
                </div>
                ` : ''}
            </div>
        `;

        itemDetailsModal.classList.add('active');
    }

    function editItem(itemId) {
        const item = patrimonioData.find(i => i.id === itemId);
        if (!item) return;

        showCustomAlert('info', 'Editar Item', 
            `A funcionalidade de edição para o item <strong>${item.descricao}</strong> (${item.numero_patrimonio}) será implementada em breve.`,
            [
                { text: 'Fechar', action: 'secondary' }
            ]
        );
    }

    function deleteItem(itemId) {
        const item = patrimonioData.find(i => i.id === itemId);
        if (!item) return;

        showCustomAlert('warning', 'Confirmar Exclusão', 
            `Tem certeza que deseja excluir o item <strong>${item.descricao}</strong> (${item.numero_patrimonio})? Esta ação não pode ser desfeita.`,
            [
                { text: 'Cancelar', action: 'secondary' },
                { text: 'Excluir', action: 'primary', callback: () => confirmDelete(itemId) }
            ]
        );
    }

    function confirmDelete(itemId) {
        // Simular exclusão
        console.log(`Excluindo item: ${itemId}`);
        showCustomAlert('success', 'Item Excluído', 'O item foi excluído com sucesso.');
        
        // Atualizar lista (em produção, faria nova requisição)
        patrimonioData = patrimonioData.filter(item => item.id !== itemId);
        updateStatistics();
        renderPatrimonio();
    }

    // =========================
    // Utilitários
    // =========================
    function getStatusText(status) {
        const statusMap = {
            'active': 'Em Uso',
            'available': 'Disponível',
            'maintenance': 'Em Manutenção',
            'inactive': 'Inativo'
        };
        return statusMap[status] || status;
    }

    function getCategoryText(category) {
        const categoryMap = {
            'computador': 'Computador',
            'periferico': 'Periférico',
            'projetor': 'Projetor',
            'mobilia': 'Mobília'
        };
        return categoryMap[category] || category;
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR');
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
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
                renderPatrimonio();
            });
        });
    }

    // =========================
    // Dados Mock (para demonstração)
    // =========================
    function getMockPatrimonio() {
        return [
            {
                id: 1,
                numero_patrimonio: 'FATEC-001',
                descricao: 'Computador Dell Optiplex i5',
                categoria: 'computador',
                local: 'Sala 101',
                status: 'active',
                data_aquisicao: '2024-01-15',
                fornecedor: 'Dell Brasil',
                nota_fiscal: 'NF-2024-00123',
                valor: 2500.00,
                observacoes: 'Kit professor - sala 101',
                ultima_manutencao: '2024-11-01',
                proxima_manutencao: '2025-05-01'
            },
            {
                id: 2,
                numero_patrimonio: 'FATEC-002',
                descricao: 'Monitor LG 24"',
                categoria: 'periferico',
                local: 'Sala 101',
                status: 'active',
                data_aquisicao: '2024-01-15',
                fornecedor: 'LG Eletronics',
                nota_fiscal: 'NF-2024-00124',
                valor: 800.00,
                observacoes: 'Monitor kit professor'
            },
            {
                id: 3,
                numero_patrimonio: 'FATEC-015',
                descricao: 'Projetor Epson PowerLite',
                categoria: 'projetor',
                local: 'Laboratório 202',
                status: 'maintenance',
                data_aquisicao: '2023-08-20',
                fornecedor: 'Epson Brasil',
                nota_fiscal: 'NF-2023-04567',
                valor: 3200.00,
                observacoes: 'Em manutenção - lâmpada queimada',
                ultima_manutencao: '2024-10-15'
            },
            {
                id: 4,
                numero_patrimonio: 'FATEC-078',
                descricao: 'Cadeira Ergonômica',
                categoria: 'mobilia',
                local: 'Sala dos Professores',
                status: 'available',
                data_aquisicao: '2024-03-10',
                fornecedor: 'FlexForm',
                nota_fiscal: 'NF-2024-03456',
                valor: 450.00,
                observacoes: 'Cadeira nova em estoque'
            },
            {
                id: 5,
                numero_patrimonio: 'FATEC-045',
                descricao: 'Notebook Lenovo ThinkPad',
                categoria: 'computador',
                local: 'Suporte TI',
                status: 'inactive',
                data_aquisicao: '2022-11-05',
                fornecedor: 'Lenovo',
                nota_fiscal: 'NF-2022-07891',
                valor: 3800.00,
                observacoes: 'Equipamento desativado - problemas na placa mãe'
            }
        ];
    }

    // =========================
    // Inicialização
    // =========================
    function init() {
        fetchAllPatrimonio();

        // Event listeners dos filtros
        searchInput.addEventListener('input', (e) => {
            activeFilters.search = e.target.value;
            currentPage = 1;
            renderPatrimonio();
        });

        filterStatus.addEventListener('change', (e) => {
            activeFilters.status = e.target.value;
            currentPage = 1;
            renderPatrimonio();
        });

        filterCategory.addEventListener('change', (e) => {
            activeFilters.category = e.target.value;
            currentPage = 1;
            renderPatrimonio();
        });

        resetFiltersBtn.addEventListener('click', () => {
            searchInput.value = '';
            filterStatus.value = '';
            filterCategory.value = '';
            activeFilters = { search: '', status: '', category: '' };
            currentPage = 1;
            renderPatrimonio();
        });

        addItemBtn.addEventListener('click', () => {
            showCustomAlert('info', 'Adicionar Item', 'A funcionalidade de adicionar novo item será implementada em breve.');
        });

        exportBtn.addEventListener('click', () => {
            showCustomAlert('info', 'Exportar Patrimônio', 'A funcionalidade de exportação será implementada em breve.');
        });

        // Event listeners do modal
        modalCloseBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                itemDetailsModal.classList.remove('active');
            });
        });

        itemDetailsModal.addEventListener('click', (e) => {
            if (e.target === itemDetailsModal) {
                itemDetailsModal.classList.remove('active');
            }
        });

        editItemBtn.addEventListener('click', () => {
            itemDetailsModal.classList.remove('active');
            showCustomAlert('info', 'Editar Item', 'O editor de itens será implementado em breve.');
        });

        // Fechar modal com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && itemDetailsModal.classList.contains('active')) {
                itemDetailsModal.classList.remove('active');
            }
        });
    }

    // Iniciar aplicação
    init();

    console.log('✅ Gerenciar Patrimônio - Admin inicializado com sucesso!');
});