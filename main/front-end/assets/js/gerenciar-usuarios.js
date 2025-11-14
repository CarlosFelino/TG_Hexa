// gerenciar-usuarios.js
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
    // Buscar usuários do backend
    // =========================
    async function fetchAllUsers() {
        try {
            const res = await fetch("/api/admin/usuarios", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            
            if (!res.ok) throw new Error("Falha ao carregar usuários");
            
            const data = await res.json();
            usersData = data.usuarios || [];
            
            updateStatistics();
            renderUsers();
            
        } catch (err) {
            console.error("Erro ao carregar usuários:", err);
            // Dados mock para demonstração
            usersData = getMockUsers();
            updateStatistics();
            renderUsers();
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
        const user = usersData.find(u => u.id === userId);
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
        const user = usersData.find(u => u.id === userId);
        if (!user) return;

        currentEditingUserId = userId;
        userFormTitle.textContent = 'Editar Usuário';
        
        // Preencher formulário
        document.getElementById('user-matricula').value = user.matricula;
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
        const user = usersData.find(u => u.id === userId);
        if (!user) return;

        showCustomAlert('warning', 'Confirmar Exclusão', 
            `Tem certeza que deseja excluir o usuário <strong>${user.name}</strong> (${user.email})? Esta ação não pode ser desfeita.`,
            [
                { text: 'Cancelar', action: 'secondary' },
                { text: 'Excluir', action: 'primary', callback: () => confirmDelete(userId) }
            ]
        );
    }

    function confirmDelete(userId) {
        // Simular exclusão
        console.log(`Excluindo usuário: ${userId}`);
        showCustomAlert('success', 'Usuário Excluído', 'O usuário foi excluído com sucesso.');
        
        // Atualizar lista (em produção, faria nova requisição)
        usersData = usersData.filter(user => user.id !== userId);
        updateStatistics();
        renderUsers();
    }

    // =========================
    // Gerenciar Formulário
    // =========================
    function setupFormHandlers() {
        addUserBtn.addEventListener('click', () => {
            currentEditingUserId = null;
            userFormTitle.textContent = 'Adicionar Novo Usuário';
            userForm.reset();
            
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

            if (document.getElementById('user-password').value) {
                formData.password = document.getElementById('user-password').value;
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
                fetchAllUsers(); // Recarregar dados
                
            } catch (error) {
                showCustomAlert('error', 'Erro', error.message);
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
    }

    async function createUser(userData) {
        // Simular criação de usuário
        console.log('Criando usuário:', userData);
        showCustomAlert('success', 'Usuário Criado', 'O usuário foi criado com sucesso.');
        
        // Em produção, faria:
        // const res = await fetch("/api/admin/usuarios", {
        //     method: "POST",
        //     headers: { 
        //         "Authorization": `Bearer ${token}`,
        //         "Content-Type": "application/json"
        //     },
        //     body: JSON.stringify(userData)
        // });
    }

    async function updateUser(userId, userData) {
        // Simular atualização de usuário
        console.log('Atualizando usuário:', userId, userData);
        showCustomAlert('success', 'Usuário Atualizado', 'O usuário foi atualizado com sucesso.');
        
        // Em produção, faria:
        // const res = await fetch(`/api/admin/usuarios/${userId}`, {
        //     method: "PUT",
        //     headers: { 
        //         "Authorization": `Bearer ${token}`,
        //         "Content-Type": "application/json"
        //     },
        //     body: JSON.stringify(userData)
        // });
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
                renderUsers();
            });
        });
    }

    // =========================
    // Utilitários
    // =========================
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR');
    }

    // =========================
    // Dados Mock (para demonstração)
    // =========================
    function getMockUsers() {
        return [
            {
                id: '1',
                matricula: '12345',
                name: 'Prof. Carlos Silva',
                email: 'carlos.silva@fatec.sp.gov.br',
                role: 'professor',
                status: 'active',
                created_at: '2024-01-01',
                last_login: '2024-12-19'
            },
            {
                id: '2',
                matricula: '12345',
                name: 'Técnico João Souza',
                email: 'joao.souza@fatec.sp.gov.br',
                role: 'suporte',
                status: 'active',
                created_at: '2024-01-02',
                last_login: '2024-12-19'
            },
            {
                id: '3',
                matricula: '12345',
                name: 'Admin Maria Oliveira',
                email: 'maria.oliveira@fatec.sp.gov.br',
                role: 'admin',
                status: 'active',
                created_at: '2024-01-03',
                last_login: '2024-12-19'
            },
            {
                id: '4',
                matricula: '1234',
                name: 'Prof. Ana Costa',
                email: 'ana.costa@fatec.sp.gov.br',
                role: 'professor',
                status: 'inactive',
                created_at: '2024-01-04',
                last_login: '2024-11-15'
            }
        ];
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
            userDetailsModal.classList.remove('active');
            // Aqui você implementaria a edição direta do usuário
            showCustomAlert('info', 'Editar Usuário', 'A edição direta do usuário será implementada em breve.');
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