// gerenciar-usuarios.js - VERSÃO INTEGRADA COM BACKEND
document.addEventListener('DOMContentLoaded', function() {
    // =========================
    // Inicialização
    // =========================
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("currentUser"));

    // =========================
    // Elementos do DOM
    // =========================
    const usersTableBody = document.getElementById('users-table-body');
    const searchInput = document.getElementById('search-users');
    const filterRole = document.getElementById('filter-role');
    const filterStatus = document.getElementById('filter-status');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const addUserBtn = document.getElementById('add-user-btn');
    const exportBtn = document.getElementById('export-users');

    // Modais
    const userDetailsModal = document.getElementById('user-details-modal');
    const userFormModal = document.getElementById('user-form-modal');
    const modalCloseBtns = document.querySelectorAll('.modal-close, .modal-close-btn');

    // Elementos do formulário
    const userForm = document.getElementById('user-form');
    const userFormTitle = document.getElementById('user-form-title');
    const saveUserBtn = document.getElementById('save-user-btn');
    const editUserBtn = document.getElementById('edit-user-btn');
    const passwordField = document.getElementById('password-field');

    // Elementos de estatísticas
    const totalUsersEl = document.getElementById('total-users');
    const totalProfessorsEl = document.getElementById('total-professors');
    const totalSupportEl = document.getElementById('total-support');
    const totalAdminsEl = document.getElementById('total-admins');

    // Filtros ativos
    let activeFilters = {
        search: '',
        role: '',
        status: ''
    };

    let usersData = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let currentEditingUserId = null;

    // =========================
    // Configuração da API
    // =========================
    const API_URL = "https://40cd6f62-b9ce-40bf-9b67-5082637ff496-00-2goj6eo5b4z6a.riker.replit.dev";

    // =========================
    // Buscar usuários do backend
    // =========================
    async function fetchAllUsers() {
        try {
            const res = await fetch(`${API_URL}/api/admin/usuarios`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) {
                throw new Error(`Erro HTTP ${res.status}`);
            }

            const data = await res.json();

            if (data.success) {
                usersData = data.usuarios || [];
                updateStatistics();
                renderUsers();
            } else {
                throw new Error(data.message || "Erro ao carregar usuários");
            }

        } catch (err) {
            console.error("Erro ao carregar usuários:", err);
            showCustomAlert('error', 'Erro', 'Não foi possível carregar os usuários. Tente novamente.');
        }
    }

    // =========================
    // Atualizar estatísticas
    // =========================
    function updateStatistics() {
        const total = usersData.length;
        const professors = usersData.filter(u => u.role === 'professor').length;
        const support = usersData.filter(u => u.role === 'suporte').length;
        const admins = usersData.filter(u => u.role === 'admin').length;

        if (totalUsersEl) totalUsersEl.textContent = total;
        if (totalProfessorsEl) totalProfessorsEl.textContent = professors;
        if (totalSupportEl) totalSupportEl.textContent = support;
        if (totalAdminsEl) totalAdminsEl.textContent = admins;
    }

    // =========================
    // Renderizar tabela
    // =========================
    function renderUsers() {
        let filteredUsers = [...usersData];

        // Aplicar filtros
        if (activeFilters.search) {
            const searchTerm = activeFilters.search.toLowerCase();
            filteredUsers = filteredUsers.filter(user => 
                user.name.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm) ||
                user.matricula.toLowerCase().includes(searchTerm)
            );
        }

        if (activeFilters.role) {
            filteredUsers = filteredUsers.filter(user => user.role === activeFilters.role);
        }

        if (activeFilters.status) {
            filteredUsers = filteredUsers.filter(user => user.status === activeFilters.status);
        }

        // Paginação
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

        // Renderizar tabela
        usersTableBody.innerHTML = '';

        if (paginatedUsers.length === 0) {
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-medium);">
                        <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        Nenhum usuário encontrado com os filtros atuais
                    </td>
                </tr>
            `;
            return;
        }

        paginatedUsers.forEach(user => {
            const row = document.createElement('tr');

            // Textos para badges
            const roleText = user.role === 'professor' ? 'Professor' : 
                           user.role === 'suporte' ? 'Suporte' : 'Administrador';

            const statusText = user.status === 'active' ? 'Ativo' : 'Inativo';

            row.innerHTML = `
                <td><strong>${user.matricula}</strong></td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="role-badge ${user.role}">${roleText}</span></td>
                <td><span class="status-badge ${user.status}">${statusText}</span></td>
                <td>${formatDate(user.created_at)}</td>
                <td>
                    <div class="actions-cell">
                        <button class="btn-table view" data-id="${user.id}" title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-table edit" data-id="${user.id}" title="Editar usuário">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-table delete" data-id="${user.id}" title="Excluir usuário">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            usersTableBody.appendChild(row);
        });

        // Adicionar event listeners aos botões
        addTableEventListeners();
        renderPagination(filteredUsers.length);
        optimizeTableForMobile();
        window.addEventListener('resize', optimizeTableForMobile);
    }

    // =========================
    // Event Listeners da Tabela
    // =========================
    function addTableEventListeners() {
        // Botão Ver
        document.querySelectorAll('.btn-table.view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.currentTarget.dataset.id;
                showUserDetails(userId);
            });
        });

        // Botão Editar
        document.querySelectorAll('.btn-table.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.currentTarget.dataset.id;
                editUser(userId);
            });
        });

        // Botão Excluir
        document.querySelectorAll('.btn-table.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.currentTarget.dataset.id;
                deleteUser(userId);
            });
        });
    }

    // =========================
    // Funções de Ação
    // =========================
    function showUserDetails(userId) {
        const user = usersData.find(u => u.id == userId);
        if (!user) return;

        const roleText = user.role === 'professor' ? 'Professor' : 
                       user.role === 'suporte' ? 'Suporte' : 'Administrador';

        document.getElementById('modal-user-details').innerHTML = `
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Matrícula:</label>
                    <span>${user.matricula}</span>
                </div>
                <div class="detail-item">
                    <label>Nome Completo:</label>
                    <span>${user.name}</span>
                </div>
                <div class="detail-item">
                    <label>Email:</label>
                    <span>${user.email}</span>
                </div>
                <div class="detail-item">
                    <label>Cargo:</label>
                    <span class="role-badge ${user.role}">${roleText}</span>
                </div>
                <div class="detail-item">
                    <label>Status:</label>
                    <span class="status-badge ${user.status}">${user.status === 'active' ? 'Ativo' : 'Inativo'}</span>
                </div>
                <div class="detail-item">
                    <label>Data de Cadastro:</label>
                    <span>${formatDate(user.created_at)}</span>
                </div>
                <div class="detail-item">
                    <label>Último Acesso:</label>
                    <span>${user.last_login ? formatDate(user.last_login) : 'Nunca acessou'}</span>
                </div>
            </div>
        `;

        userDetailsModal.classList.add('active');
    }

    function editUser(userId) {
        const user = usersData.find(u => u.id == userId);
        if (!user) return;

        currentEditingUserId = userId;
        userFormTitle.textContent = 'Editar Usuário';

        // Preencher formulário
        document.getElementById('user-matricula').value = user.matricula;
        document.getElementById('user-matricula').disabled = true; // Matrícula não pode ser editada
        document.getElementById('user-name').value = user.name;
        document.getElementById('user-email').value = user.email;
        document.getElementById('user-role').value = user.role;
        document.getElementById('user-status').value = user.status;

        // Ocultar campo de senha na edição
        passwordField.style.display = 'none';
        document.getElementById('user-password').required = false;

        userFormModal.classList.add('active');
    }

    function deleteUser(userId) {
        console.log('🗑️ [DELETE] Função deleteUser chamada para ID:', userId);

        const user = usersData.find(u => u.id == userId);
        if (!user) {
            console.error('❌ [DELETE] Usuário não encontrado na lista local');
            return;
        }

        console.log('🗑️ [DELETE] Usuário encontrado:', user);
        console.log('🗑️ [DELETE] Abrindo modal de confirmação...');

        showCustomAlert('warning', 'Confirmar Exclusão', 
            `Tem certeza que deseja excluir o usuário <strong>${user.name}</strong> (${user.email})? Esta ação não pode ser desfeita e também removerá a matrícula autorizada.`,
            [
                { 
                    text: 'Cancelar', 
                    action: 'secondary',
                    callback: () => console.log('🗑️ [DELETE] Exclusão cancelada pelo usuário')
                },
                { 
                    text: 'Excluir', 
                    action: 'primary', 
                    callback: () => {
                        console.log('🗑️ [DELETE] Botão Excluir clicado! Chamando confirmDelete...');
                        confirmDelete(userId);
                    }
                }
            ]
        );
    }

    async function confirmDelete(userId) {
        console.log('🗑️ [DELETE] Iniciando exclusão do usuário ID:', userId);

        try {
            console.log('🗑️ [DELETE] Fazendo requisição DELETE...');
            console.log('🗑️ [DELETE] URL:', `${API_URL}/api/admin/usuarios/${userId}`);

            const res = await fetch(`${API_URL}/api/admin/usuarios/${userId}`, {
                method: 'DELETE',
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            console.log('🗑️ [DELETE] Status da resposta:', res.status);
            console.log('🗑️ [DELETE] Response OK?', res.ok);

            const data = await res.json();
            console.log('🗑️ [DELETE] Dados recebidos:', data);

            if (data.success) {
                console.log('✅ [DELETE] Usuário deletado com sucesso!');
                showCustomAlert('success', 'Usuário Excluído', data.message || 'O usuário foi excluído com sucesso.');
                await fetchAllUsers(); // Recarregar lista
            } else {
                console.log('❌ [DELETE] Falha ao deletar:', data.message);
                showCustomAlert('error', 'Erro', data.message || 'Não foi possível excluir o usuário.');
            }

        } catch (error) {
            console.error('❌ [DELETE] Erro ao excluir usuário:', error);
            console.error('❌ [DELETE] Tipo do erro:', error.constructor.name);
            console.error('❌ [DELETE] Mensagem:', error.message);
            console.error('❌ [DELETE] Stack:', error.stack);
            showCustomAlert('error', 'Erro', 'Erro ao excluir usuário. Tente novamente.');
        }
    }

    // =========================
    // Gerenciar Formulário
    // =========================
    function setupFormHandlers() {
        addUserBtn.addEventListener('click', () => {
            currentEditingUserId = null;
            userFormTitle.textContent = 'Adicionar Novo Usuário';
            userForm.reset();

            // Habilitar campo de matrícula
            document.getElementById('user-matricula').disabled = false;

            // Mostrar campo de senha para novo usuário
            passwordField.style.display = 'block';
            document.getElementById('user-password').required = true;

            userFormModal.classList.add('active');
        });

        saveUserBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            if (!userForm.checkValidity()) {
                userForm.reportValidity();
                return;
            }

            const formData = {
                matricula: document.getElementById('user-matricula').value,
                name: document.getElementById('user-name').value,
                email: document.getElementById('user-email').value,
                role: document.getElementById('user-role').value,
                status: document.getElementById('user-status').value
            };

            const password = document.getElementById('user-password').value;
            if (password && password.trim() !== '') {
                formData.password = password;
            }

            try {
                if (currentEditingUserId) {
                    // Editar usuário existente
                    await updateUser(currentEditingUserId, formData);
                } else {
                    // Criar novo usuário
                    await createUser(formData);
                }

                userFormModal.classList.remove('active');
                await fetchAllUsers(); // Recarregar dados

            } catch (error) {
                console.error('Erro no formulário:', error);
            }
        });

        // Validação de email institucional
        document.getElementById('user-email').addEventListener('blur', function() {
            const email = this.value;
            if (email && !email.endsWith('@fatec.sp.gov.br')) {
                this.setCustomValidity('Por favor, use um email institucional da Fatec (@fatec.sp.gov.br)');
            } else {
                this.setCustomValidity('');
            }
        });

        // Validação de matrícula (5 ou 13 dígitos dependendo do cargo)
        const matriculaInput = document.getElementById('user-matricula');
        const roleSelect = document.getElementById('user-role');

        roleSelect.addEventListener('change', function() {
            const role = this.value;
            if (role === 'professor') {
                matriculaInput.maxLength = 5;
                matriculaInput.placeholder = '5 dígitos (professor)';
                matriculaInput.pattern = '[0-9]{5}';
            } else {
                matriculaInput.maxLength = 13;
                matriculaInput.placeholder = '13 dígitos (suporte/admin)';
                matriculaInput.pattern = '[0-9]{13}';
            }
        });

        matriculaInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, ''); // Apenas números

            const role = roleSelect.value;
            const maxLength = role === 'professor' ? 5 : 13;

            if (this.value.length > maxLength) {
                this.value = this.value.slice(0, maxLength);
            }
        });
    }

    async function createUser(userData) {
        try {
            const res = await fetch(`${API_URL}/api/admin/usuarios`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            });

            const data = await res.json();

            if (data.success) {
                showCustomAlert('success', 'Usuário Criado', data.message || 'O usuário foi criado com sucesso.');
            } else {
                showCustomAlert('error', 'Erro', data.message || 'Não foi possível criar o usuário.');
            }

        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            showCustomAlert('error', 'Erro', 'Erro ao criar usuário. Tente novamente.');
        }
    }

    async function updateUser(userId, userData) {
        try {
            const res = await fetch(`${API_URL}/api/admin/usuarios/${userId}`, {
                method: "PUT",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            });

            const data = await res.json();

            if (data.success) {
                showCustomAlert('success', 'Usuário Atualizado', data.message || 'O usuário foi atualizado com sucesso.');
            } else {
                showCustomAlert('error', 'Erro', data.message || 'Não foi possível atualizar o usuário.');
            }

        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            showCustomAlert('error', 'Erro', 'Erro ao atualizar usuário. Tente novamente.');
        }
    }

    // =========================
    // Sistema de Alertas Padronizado
    // =========================
    function showCustomAlert(type, title, message, buttons = []) {
        console.log('🔔 [ALERT] Criando alerta:', type, title);
        console.log('🔔 [ALERT] Botões:', buttons);

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
                ${buttons.map((btn, index) => `
                    <button class="alert-btn alert-btn-${btn.action}" data-index="${index}">
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
        console.log('🔔 [ALERT] Alerta adicionado ao DOM');

        // Event listeners para botões
        alertOverlay.querySelectorAll('.alert-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                const index = parseInt(this.dataset.index);
                const buttonConfig = buttons[index];

                console.log('🔔 [ALERT] Botão clicado:', buttonConfig.text);
                console.log('🔔 [ALERT] Index:', index);
                console.log('🔔 [ALERT] Tem callback?', !!buttonConfig.callback);

                if (buttonConfig && buttonConfig.callback) {
                    console.log('🔔 [ALERT] Executando callback...');
                    buttonConfig.callback();
                }

                console.log('🔔 [ALERT] Removendo alerta...');
                alertOverlay.remove();
            });
        });

        // Fechar ao clicar fora ou pressionar ESC
        alertOverlay.addEventListener('click', (e) => {
            if (e.target === alertOverlay) {
                console.log('🔔 [ALERT] Fechado clicando fora');
                alertOverlay.remove();
            }
        });

        const escapeHandler = function(e) {
            if (e.key === 'Escape') {
                console.log('🔔 [ALERT] Fechado com ESC');
                alertOverlay.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };

        document.addEventListener('keydown', escapeHandler);

        // Mostrar com animação
        setTimeout(() => {
            alertOverlay.classList.add('visible');
            console.log('🔔 [ALERT] Alerta visível');
        }, 10);
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
                renderUsers();
            });
        });
    }

    // =========================
    // Otimização para Mobile
    // =========================

    function optimizeTableForMobile() {
        const table = document.querySelector('.users-table');
        const tableContainer = document.querySelector('.table-responsive');
        
        if (!table || !tableContainer) return;

        // Adiciona indicador visual de scroll horizontal apenas em mobile
        if (window.innerWidth <= 576) {
            tableContainer.style.position = 'relative';
            
            // Remove indicador existente se houver
            const existingIndicator = tableContainer.querySelector('.scroll-indicator');
            if (existingIndicator) existingIndicator.remove();
            
            // Adiciona novo indicador
            const indicator = document.createElement('div');
            indicator.className = 'scroll-indicator';
            indicator.innerHTML = '<i class="fas fa-chevron-right"></i>';
            tableContainer.appendChild(indicator);
            
            // Remove o indicador após primeiro scroll
            const scrollHandler = function() {
                indicator.style.display = 'none';
                tableContainer.removeEventListener('scroll', scrollHandler);
            };
            
            tableContainer.addEventListener('scroll', scrollHandler, { once: true });
        }
    }


    // =========================
    // Utilitários
    // =========================
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-BR');
    }

    // =========================
    // Inicialização
    // =========================
    function init() {
        fetchAllUsers();
        setupFormHandlers();

        // Event listeners dos filtros
        searchInput.addEventListener('input', (e) => {
            activeFilters.search = e.target.value;
            currentPage = 1;
            renderUsers();
        });

        filterRole.addEventListener('change', (e) => {
            activeFilters.role = e.target.value;
            currentPage = 1;
            renderUsers();
        });

        filterStatus.addEventListener('change', (e) => {
            activeFilters.status = e.target.value;
            currentPage = 1;
            renderUsers();
        });

        resetFiltersBtn.addEventListener('click', () => {
            searchInput.value = '';
            filterRole.value = '';
            filterStatus.value = '';
            activeFilters = { search: '', role: '', status: '' };
            currentPage = 1;
            renderUsers();
        });

        exportBtn.addEventListener('click', () => {
            showCustomAlert('info', 'Exportar Usuários', 'A funcionalidade de exportação será implementada em breve.');
        });

        // Event listeners dos modais
        modalCloseBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                userDetailsModal.classList.remove('active');
                userFormModal.classList.remove('active');
            });
        });

        [userDetailsModal, userFormModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        editUserBtn.addEventListener('click', () => {
            const userId = currentEditingUserId;
            userDetailsModal.classList.remove('active');
            if (userId) {
                editUser(userId);
            }
        });

        // Fechar modais com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                userDetailsModal.classList.remove('active');
                userFormModal.classList.remove('active');
            }
        });
    }

    // Iniciar aplicação
    init();

    console.log('✅ Gerenciar Usuários - Admin inicializado com sucesso!');
});